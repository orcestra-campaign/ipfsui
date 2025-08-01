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
  isProfile,
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
  const missing_value = attrs?.missing_value;
  if (scale === 1. && offset === 0. && missing_value === undefined) return data;
  const out = Float64Array.from(data).map((v) =>
    v === missing_value ? NaN : v * scale + offset
  );
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
    let hi = -(2n ** 64n);
    let lo = -hi;
    const { data } = await get(variable);
    const valid_min = -(2n ** 63n - 2n);
    const valid_max = 2n ** 63n - 2n;
    const is_valid = (v: bigint) => (v >= valid_min) && (v <= valid_max); // numbers outside this range may be valid, but they are unlikely, but may frequently be used to mark fill values.
    for (const v of data) {
      if (is_valid(v)) {
        hi = hi > v ? hi : v;
        lo = lo < v ? lo : v;
      }
    }
    return [Number(lo), Number(hi)];
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

  let i1 = 0;
  let i2 = keep.length - 1;
  for (; i1 < keep.length; ++i1) {
    if (isFinite(xs[i1]) && isFinite(xs[i1])) {
      keep[i1] = 1;
      break;
    }
  }
  for (; i2 >= 0; --i2) {
    if (isFinite(xs[i2]) && isFinite(xs[i2])) {
      keep[i2] = 1;
      break;
    }
  }

  const nKeep = 2 +
    _simplifyGeometry(xs, ys, maxDistanceSq, i1, i2, keep);

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
      "dataset",
      ds.src,
      "is a trajectory, but it was not possible to figure out the coordinates",
    );
    return getSpatialBoundsDefault(ds);
  }

  const [lats2, lons2] = simplifyGeometry(lats, lons, .0001);

  const [lat0, lat1] = nanMinMax(lats2);
  const [lon0, lon1] = nanMinMax(lons2);

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

async function getSpatialBoundsProfile(
  ds: DatasetMetadata,
): Promise<
  { bbox: BBox; geometry: Geometry } | undefined
> {
  let lats: LikeAnArray<number> | undefined = undefined;
  let lons: LikeAnArray<number> | undefined = undefined;
  for (const [varname, variable] of Object.entries(ds.variables)) {
    if (
      isLatitudeVariable(varname, variable.attrs) &&
      [0, 1].includes(variable.shape.length)
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
      "dataset",
      ds.src,
      "is a profile, but it was not possible to figure out the coordinates",
    );
    return getSpatialBoundsDefault(ds);
  }

  const [lat0, lat1] = nanMinMax(lats);
  const [lon0, lon1] = nanMinMax(lons);

  const coordinates = Array.from(lons).map((lon, i) => [lon, lats[i]]) as [
    number,
    number,
  ][];

  return {
    bbox: [lon0, lat0, lon1, lat1],
    geometry: {
      type: "MultiPoint",
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
  } else if (isProfile(ds)) {
    return getSpatialBoundsProfile(ds);
  } else {
    return getSpatialBoundsDefault(ds);
  }
}

async function getTimeBounds(
  ds: DatasetMetadata,
): Promise<
  { start_datetime: string; end_datetime: string; datetime: string } | undefined
> {
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
    const start_datetime = dayjs.min(...times) as dayjs.Dayjs;
    const end_datetime = dayjs.max(...times) as dayjs.Dayjs;
    return {
      datetime: start_datetime.add(end_datetime.diff(start_datetime) / 2)
        .toISOString(),
      start_datetime: start_datetime.toISOString(),
      end_datetime: end_datetime.toISOString(),
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
        } else if (hasAxis(attrs)) {
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

function isObject(item: unknown) {
  return item !== null && typeof item === "object" && !Array.isArray(item);
}

function deepMerge<T>(target: T, ...sources: Array<Partial<T>>): T {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key];
        if (sourceValue !== undefined && isObject(target[key])) {
          target = { ...target, [key]: deepMerge(target[key], sourceValue) };
        } else {
          target = { ...target, [key]: sourceValue };
        }
      }
    }
  }
  return deepMerge(target, ...sources);
}

async function* asCompleted<T>(promises: Array<Promise<T>>): AsyncGenerator<T> {
  const _promises = promises
    .map((p, i) => {
      return {
        key: i,
        promise: p.then((r) => {
          return { key: i, result: r };
        }),
      };
    });

  while (_promises.length > 0) {
    const { key, result } = await Promise.race(
      _promises.map(({ promise }) => promise),
    );
    yield result;
    const index = _promises.findIndex((p) => p.key === key);
    if (index !== -1) {
      _promises.splice(index, 1);
    }
  }
}

export function metadataToStacId(ds: { item_cid?: CID; src: string }): string {
  return (ds?.item_cid?.toString() ?? ds.src) + "-stac_item";
}

function parseCommaList(cs_list: string | undefined): string[] | undefined {
  if (!cs_list) {
    return undefined;
  }

  // Replace commas within quotes with a placeholder
  cs_list = cs_list.replace(/"[^"]*"|'[^']*'/g, (match) => {
    return match.replace(/,/g, "__COMMA_PLACEHOLDER__");
  });

  // Split the string at the remaining commas
  const list = cs_list.split(",").map((n: string) => n.trim());

  // Replace the placeholders back with commas
  return list.map((item) => item.replace(/__COMMA_PLACEHOLDER__/g, ","));
}

export default async function* parseMetadata(
  ds: DatasetMetadata,
): AsyncGenerator<StacItem> {
  let stableSrc = ds.src;

  if (ds.item_cid !== undefined) {
    stableSrc = "ipfs://" + ds.item_cid.toString();
  }

  const properties: Properties = {
    title: ds.attrs?.title,
    description: ds.attrs?.summary,
    keywords: parseCommaList(ds.attrs?.keywords),
    license: ds.attrs?.license,
    references: parseCommaList(ds.attrs?.references),
    platform: ds.attrs?.platform,
    mission: ds.attrs?.project,
    "processing:lineage": ds.attrs?.history,
    ...getDatacubeProperties(ds),
  };

  const names = parseCommaList(ds.attrs.creator_name ?? ds.attrs.authors);
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

  let stacItem: StacItem = {
    type: "Feature",
    stac_version: "1.1.0",
    stac_extensions: [],
    id: metadataToStacId(ds),
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

  yield stacItem;

  const fetchTime = async () => {
    return {
      properties: { ...(await getTimeBounds(ds)) },
    } as Partial<StacItem>;
  };

  const fetchSpatial = async () => {
    return { ...(await getSpatialBounds(ds)) } as Partial<StacItem>;
  };

  const promises = [fetchTime(), fetchSpatial()];
  for await (const result of asCompleted(promises)) {
    stacItem = deepMerge(stacItem, result);
    yield stacItem;
  }
}
