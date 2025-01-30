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
  isTrajectory,
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

// @ts-expect-error too lazy to think of types
function applyOffsetAndScale(data, attrs) {
  const scale = attrs?.scale_factor ?? 1.;
  const offset = attrs?.add_offset ?? 0.;
  if (scale === 1. && offset === 0.) return data;
  const out = Float64Array.from(data).map((v) => v * scale + offset);
  return out;
}

function nanMinMax(array: Iterable<number>): [number, number] {
  if (array === undefined) return [NaN, NaN];
  let hi = -Infinity;
  let lo = Infinity;

  for (const v of array) {
    if (isFinite(v)) {
      hi = hi > v ? hi : v;
      lo = lo < v ? lo : v;
    }
  }
  return [hi, lo];
}

async function getMinMax(variable: SomeArray): Promise<[number, number]> {
  if (variable.is("number")) {
    const data = applyOffsetAndScale(
      (await get(variable)).data,
      variable.attrs,
    );
    return nanMinMax(data);
  } else if (variable.is("bigint")) {
    let hi = BigInt(-Number.MAX_SAFE_INTEGER);
    let lo = BigInt(Number.MAX_SAFE_INTEGER);
    const { data } = await get(variable);
    for (const v of data) {
      hi = hi > v ? hi : v;
      lo = lo < v ? lo : v;
    }
    return [Number(hi), Number(lo)];
  } else {
    return [NaN, NaN];
  }
}

async function getSpatialBoundsDefault(
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

interface LikeAnArray<T> extends Iterable<T> {
  [n: number]: T;
  length: number;
  constructor: new (size: number) => LikeAnArray<T>;
}

function sqLineDist(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  // squared distance form (x0, y0) to line (x1, y1) -- (x2, y2)
  // Adapted from the [Simplify.js](https://mourner.github.io/simplify-js/) library.
  let x = x1;
  let y = y1;
  let dx = x2 - x1;
  let dy = y2 - y1;

  if (dx !== 0 || dy !== 0) {
    const t = ((x0 - x) * dx + (y0 - y) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      x = x2;
      y = y2;
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = x0 - x;
  dy = y0 - y;

  return dx * dx + dy * dy;
}

function _simplifyGeometry<T extends LikeAnArray<number>>(
  xs: T,
  ys: T,
  maxDistanceSq: number,
  i1: number,
  i2: number,
  keep: Uint8Array,
): number {
  const x1 = xs[i1];
  const y1 = ys[i1];
  const x2 = xs[i2];
  const y2 = ys[i2];

  let maxIndex = 0;
  let maxSqDistInSegment = -1;

  for (let i = i1 + 1; i < i2; i++) {
    const sqDist = sqLineDist(xs[i], ys[i], x1, y1, x2, y2);
    if (sqDist > maxSqDistInSegment) {
      maxIndex = i;
      maxSqDistInSegment = sqDist;
    }
  }

  let nKeep = 0;

  if (maxSqDistInSegment > maxDistanceSq) {
    keep[maxIndex] = 1;
    nKeep = 1;

    if (maxIndex - i1 > 1) {
      nKeep += _simplifyGeometry(xs, ys, maxDistanceSq, i1, maxIndex, keep);
    }

    if (i2 - maxIndex > 1) {
      nKeep += _simplifyGeometry(xs, ys, maxDistanceSq, maxIndex, i2, keep);
    }
  }
  return nKeep;
}

function simplifyGeometry<T extends LikeAnArray<number>>(
  xs: T,
  ys: T,
  maxDistance: number,
): [T, T] {
  // adapted from https://observablehq.com/@chnn/running-ramer-douglas-peucker-on-typed-arrays
  const keep = new Uint8Array(xs.length);
  const maxDistanceSq = maxDistance * maxDistance;

  keep[0] = 1;
  keep[keep.length - 1] = 1;

  const nKeep = 2 +
    _simplifyGeometry(xs, ys, maxDistanceSq, 0, keep.length - 1, keep);

  const xsOut = new xs.constructor(nKeep) as T;
  const ysOut = new ys.constructor(nKeep) as T;

  let i = 0;

  for (let j = 0; j < keep.length; j++) {
    if (keep[j] === 1) {
      xsOut[i] = xs[j];
      ysOut[i] = ys[j];
      i++;
    }
  }
  return [xsOut, ysOut];
}

async function getSpatialBoundsTrajectory(
  ds: DatasetMetadata,
): Promise<
  { bbox: BBox; geometry: Geometry } | undefined
> {
  let lats: LikeAnArray<number> | undefined = undefined;
  let lons: LikeAnArray<number> | undefined = undefined;
  for (const [varname, variable] of Object.entries(ds.variables)) {
    if (
      isLatitudeVariable(varname, variable.attrs) && variable.shape.length == 1
    ) {
      if (lats !== undefined) console.warn("more than one latitude variable");
      lats = applyOffsetAndScale((await get(variable)).data, variable.attrs);
    }
    if (
      isLongitudeVariable(varname, variable.attrs) && variable.shape.length == 1
    ) {
      if (lons !== undefined) console.warn("more than one longitude variable");
      lons = applyOffsetAndScale((await get(variable)).data, variable.attrs);
    }
  }
  if (lats === undefined || lons === undefined) {
    console.warn(
      "dataset is a trajaectory, but it was not possible to figure out the coordinates",
    );
    return getSpatialBoundsDefault(ds);
  }

  const [lat0, lat1] = nanMinMax(lats);
  const [lon0, lon1] = nanMinMax(lons);

  const [lats2, lons2] = simplifyGeometry(lats, lons, .0001);
  const coordinates = Array.from(lons2).map((lon, i) => [lon, lats2[i]]) as [
    number,
    number,
  ][];

  return {
    bbox: [lon0, lat0, lon1, lat1],
    geometry: {
      type: "LineString",
      coordinates,
    },
  };
}

function getSpatialBounds(
  ds: DatasetMetadata,
): Promise<
  { bbox: BBox; geometry: Geometry } | undefined
> {
  if (isTrajectory(ds)) {
    return getSpatialBoundsTrajectory(ds);
  } else {
    return getSpatialBoundsDefault(ds);
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
