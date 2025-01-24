import type { Geometry, Properties, StacItem } from "./stac";
import type { LooseGlobalAttrs } from "./dsAttrConvention";
import {
  decodeTime,
  hasUnits,
  isLatitudeVariable,
  isLongitudeVariable,
  isTimeVariable,
} from "./cf";
import { get, slice } from "./ds";
import type { SomeArray } from "./ds/types";
import dayjs from "dayjs";

interface DatasetMetadata {
  src: string;
  attrs: LooseGlobalAttrs;
  variables: {
    [key: string]: SomeArray;
  };
}

async function getFirstAndLast(variable: SomeArray): Promise<[number, number]> {
  return [
    ...(await get(variable, [slice(0, null, variable.shape[0] - 1)])).data,
  ] as [number, number];
}

async function getSpatialBounds(
  ds: DatasetMetadata,
): Promise<
  { bbox: [number, number, number, number]; geometry: Geometry } | undefined
> {
  const lats = [];
  const lons = [];
  for (const [varname, variable] of Object.entries(ds.variables)) {
    const attrs = variable.attrs;
    if (hasUnits(attrs) && variable.shape.length == 1) {
      if (isLatitudeVariable(varname, attrs)) {
        lats.push(...await getFirstAndLast(variable));
      }
      if (isLongitudeVariable(varname, attrs)) {
        lons.push(...await getFirstAndLast(variable));
      }
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
      hasUnits(attrs) && isTimeVariable(varname, attrs) &&
      variable.shape.length == 1
    ) {
      times.push(
        ...(await getFirstAndLast(variable)).map((t) =>
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

export default async function parseMetadata(
  ds: DatasetMetadata,
): Promise<StacItem> {
  const properties: Properties = {
    title: ds.attrs?.title,
    description: ds.attrs?.summary,
    keywords: ds.attrs?.keywords?.split(",").map((n: string) => n.trim()),
    license: ds.attrs?.license,
    platform: ds.attrs?.platform,
    mission: ds.attrs?.project,
    "processing:lineage": ds.attrs?.history,
    ...(await getTimeBounds(ds)),
    ...(await getSpatialBounds(ds)),
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
    id: "TODO: need some ID / CID",
    geometry: null,
    // bbox: [1,2,3,4],
    properties,
    links: [],
    assets: {
      data: {
        href: ds.src,
        roles: ["data"],
        type: "application/vnd+zarr",
      },
    },
  };
}
