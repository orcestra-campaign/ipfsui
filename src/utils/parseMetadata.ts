import type { Properties, StacItem } from "./stac";
import type { LooseGlobalAttrs } from "./dsAttrConvention";
import { decodeTime, hasUnits, isTimeVariable } from "./cf";
import { get, slice } from "./ds";
import type { SomeArray } from "./ds/types";
import dayjs from "dayjs";

interface DatasetMetadata {
  attrs: LooseGlobalAttrs;
  variables: {
    [key: string]: SomeArray;
  };
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
  };

  const time_vars: { name: string; t0: dayjs.Dayjs; t1: dayjs.Dayjs }[] = [];
  for (const [varname, variable] of Object.entries(ds.variables)) {
    console.log(variable);
    const attrs = variable.attrs;
    if (
      hasUnits(attrs) && isTimeVariable(varname, attrs) &&
      variable.shape.length == 1
    ) {
      const [t0, t1] = [
        ...(await get(variable, [slice(0, null, variable.shape[0] - 1)])).data,
      ]
        .map((t) => decodeTime(t as number, attrs) as dayjs.Dayjs);

      time_vars.push({ name: varname, t0, t1 });
    }
  }

  if (time_vars.length > 0) {
    properties.start_datetime = (dayjs.min(...time_vars.map(({ t0 }) =>
      t0
    )) as dayjs.Dayjs).toISOString();
    properties.end_datetime = (dayjs.max(...time_vars.map(({ t1 }) =>
      t1
    )) as dayjs.Dayjs).toISOString();
  }

  const names = (ds.attrs.creator_name ?? ds.attrs.authors)?.split(",").map((
    n: string,
  ) => n.trim());
  console.log("attrs", ds.attrs.authors);
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
    assets: new Map(),
  };
}
