import type {
  BBox,
  Dimension,
  Geometry,
  Properties,
  StacItem,
  Variable,
} from "./stac.ts";
import type { LooseGlobalAttrs } from "./dsAttrConvention.ts";
import {
  decodeTime,
  hasAxis,
  hasLongName,
  hasUnits,
  isLatitudeVariable,
  isLongitudeVariable,
  isTimeVariable,
} from "./cf/index.ts";
import { get, getDimensions } from "./ds/index.ts";
import type { SomeArray } from "./ds/types.ts";
import dayjs from "dayjs";

import { CID } from "multiformats";

export interface DatasetMetadata {
  src: string;
  attrs: LooseGlobalAttrs;
  variables: {
    [key: string]: SomeArray;
  };
  item_cid?: CID;
  root_cid?: CID;
}

/*
async function getFirstAndLast(variable: SomeArray): Promise<[number, number]> {
  return [
    ...(await get(variable, [slice(0, null, variable.shape[0] - 1)])).data,
  ] as [number, number];
}
*/

async function getMinMax(variable: SomeArray): Promise<[number, number]> {
  if (variable.is("number")) {
    let hi = -Infinity;
    let lo = Infinity;
    const { data } = await get(variable);
    for (const v of data) {
      if (isFinite(v)) {
        hi = hi > v ? hi : v;
        lo = lo < v ? lo : v;
      }
    }
    return [hi, lo];
  } else {
    return [NaN, NaN];
  }
}

async function getSpatialBounds(
  ds: DatasetMetadata,
): Promise<
  { bbox: BBox; geometry: Geometry } | undefined
> {
  const lats = [];
  const lons = [];
  for (const [varname, variable] of Object.entries(ds.variables)) {
    if (isLatitudeVariable(varname, variable.attrs)) {
      lats.push(...await getMinMax(variable));
    }
    if (isLongitudeVariable(varname, variable.attrs)) {
      lons.push(...await getMinMax(variable));
    }
  }
  if (lats.length > 0 && lons.length > 0) {
    const lat0 = Math.min(...lats);
    const lat1 = Math.max(...lats);
    const lon0 = Math.min(...lons);
    const lon1 = Math.max(...lons);
    return {
      bbox: [lon0, lat0, lon1, lat1],
      geometry: {
        type: "Polygon",
        coordinates: [[[lon0, lat0], [lon1, lat0], [lon1, lat1], [lon0, lat1], [
          lon0,
          lat0,
        ]]],
      },
    };
  }
}

async function getTimeBounds(
  ds: DatasetMetadata,
): Promise<{ start_datetime: string; end_datetime: string } | undefined> {
  const times = [];
  for (const [varname, variable] of Object.entries(ds.variables)) {
    const attrs = variable.attrs;
    if (
      hasUnits(attrs) && isTimeVariable(varname, attrs)
    ) {
      times.push(
        ...(await getMinMax(variable)).map((t) =>
          decodeTime(t, attrs) as dayjs.Dayjs
        ),
      );
    }
  }

  if (times.length > 0) {
    return {
      start_datetime: (dayjs.min(...times) as dayjs.Dayjs).toISOString(),
      end_datetime: (dayjs.max(...times) as dayjs.Dayjs).toISOString(),
    };
  }
}

function getDatacubeProperties(
  ds: DatasetMetadata,
): {
  "cube:dimensions"?: { [key: string]: Dimension };
  "cube:variables"?: { [key: string]: Variable };
} {
  const dimensions: { [key: string]: Dimension } = {};
  const variables: { [key: string]: Variable } = {};
  for (const [varname, variable] of Object.entries(ds.variables)) {
    const varDimensions = getDimensions(variable);
    if (varDimensions !== undefined) {
      const attrs = variable.attrs;
      if (varDimensions.length == 1 && varDimensions[0] == varname) {
        if (hasUnits(attrs)) {
          if (isTimeVariable(varname, attrs)) {
            dimensions[varname] = {
              type: "temporal",
              unit: attrs.units,
              ...(hasLongName(attrs) && { description: attrs.long_name }),
            };
            continue;
          }
        }
        if (hasAxis(attrs)) {
          const axis = attrs.axis.toLowerCase();
          if (["x", "y", "z"].includes(axis)) {
            dimensions[varname] = {
              type: "spatial",
              axis: axis as "x" | "y" | "z",
              ...(hasUnits(attrs) && { unit: attrs.units }),
              ...(hasLongName(attrs) && { description: attrs.long_name }),
            };
            continue;
          }
        }
      } else {
        variables[varname] = {
          dimensions: varDimensions,
          type: "data",
          ...(hasUnits(attrs) && { unit: attrs.units }),
          ...(hasLongName(attrs) && { description: attrs.long_name }),
        };
        continue;
      }
    }
  }
  return { "cube:dimensions": dimensions, "cube:variables": variables };
}

export default async function parseMetadata(
  ds: DatasetMetadata,
): Promise<StacItem> {
  let stableSrc = ds.src;

  if (ds.item_cid !== undefined) {
    stableSrc = "ipfs://" + ds.item_cid.toString();
  }

  const properties: Properties = {
    title: ds.attrs?.title,
    description: ds.attrs?.summary,
    keywords: ds.attrs?.keywords?.split(",").map((n: string) => n.trim()),
    license: ds.attrs?.license,
    platform: ds.attrs?.platform,
    mission: ds.attrs?.project,
    "processing:lineage": ds.attrs?.history,
    ...(await getTimeBounds(ds)),
    ...getDatacubeProperties(ds),
  };

  const names = (ds.attrs.creator_name ?? ds.attrs.authors)?.split(",").map((
    n: string,
  ) => n.trim());
  const emails = ds.attrs.creator_email?.split(",").map((n: string) =>
    n.trim()
  );
  const contacts = [];

  if (names !== undefined) {
    for (const [i, name] of names.entries()) {
      const es = [];
      if (emails !== undefined && emails.length > i) {
        es.push({ value: emails[i], roles: [] });
      }
      contacts.push({ name, emails: es });
    }
    properties.contacts = contacts;
  }

  return {
    type: "Feature",
    stac_version: "1.1.0",
    stac_extensions: [],
    id: (ds?.item_cid?.toString() ?? ds.src) + "-stac_item",
    ...(await getSpatialBounds(ds)),
    properties,
    links: [],
    assets: {
      data: {
        href: stableSrc,
        roles: ["data"],
        type: "application/vnd+zarr",
      },
    },
  };
}
