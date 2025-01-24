import type { Properties, StacItem } from "./stac";
import type { LooseGlobalAttrs } from "./dsAttrConvention";
import { decodeTime, hasUnits, isTimeVariable } from "./cf";
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
      times.push(...(await getFirstAndLast(variable)).map((t) => decodeTime(t, attrs) as dayjs.Dayjs));
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
