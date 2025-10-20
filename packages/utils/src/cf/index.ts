import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import minMax from "dayjs/plugin/minMax.js";
import type { ManipulateType } from "dayjs";
import type { DatasetMetadata } from "../parseMetadata";

dayjs.extend(utc);
dayjs.extend(minMax);

const unitsRegEx = /([a-zA-Z]+) since (.+)$/;

export function hasUnits(
  maybeHasUnits: unknown,
): maybeHasUnits is { units: string } {
  return typeof (maybeHasUnits as { units: string }).units === "string";
}

export function hasLongName(
  maybeHasUnits: unknown,
): maybeHasUnits is { long_name: string } {
  return typeof (maybeHasUnits as { long_name: string }).long_name === "string";
}

export function hasAxis(
  maybeHasUnits: unknown,
): maybeHasUnits is { axis: string } {
  return typeof (maybeHasUnits as { axis: string }).axis === "string";
}

type IntervalType = ManipulateType | "nanoseconds" | "microseconds";

function isInterval(maybeInterval: string): maybeInterval is ManipulateType {
  return [
    "nanoseconds",
    "microseconds",
    "milliseconds",
    "seconds",
    "minutes",
    "hours",
    "days",
  ].includes(
    maybeInterval,
  );
}

export function parseTimeUnits(
  units: string,
): { interval: IntervalType; refdate: string } | undefined {
  const regExMatch = units.match(unitsRegEx);
  if (!regExMatch) {
    return undefined;
  }
  const [, interval, refdate] = regExMatch;
  if (isInterval(interval)) {
    return { interval, refdate };
  }
}

export function isTimeVariable(_name: string, attrs: { units: string }) {
  return !!parseTimeUnits(attrs.units);
}

export function decodeTime(
  value: number,
  attrs: { units: string },
): dayjs.Dayjs | undefined {
  const timeUnits = parseTimeUnits(attrs.units);
  if (timeUnits === undefined) {
    return undefined;
  }
  let { interval, refdate } = timeUnits;
  if (interval === "nanoseconds") {
    value = value * 1e-6;
    interval = "milliseconds";
  } else if (interval === "microseconds") {
    value = value * 1e-3;
    interval = "milliseconds";
  }
  const ref = dayjs.utc(refdate);
  const timepoint = ref.add(value, interval);
  return timepoint;
}

export function isLatitudeVariable(name: string, attrs: unknown) {
  return (hasUnits(attrs) && !!attrs.units.match(/degrees?_?(N|north)/)) ||
    name == "lat" || name == "latitude";
}

export function isLongitudeVariable(name: string, attrs: unknown) {
  return (hasUnits(attrs) && !!attrs.units.match(/degrees?_?(E|east)/)) ||
    name == "lon" || name == "longitude";
}

export function isProfile(ds: DatasetMetadata) {
  if (ds.attrs?.featureType === undefined) return false;
  return ds.attrs?.featureType === "profile";
}

export function isTrajectory(ds: DatasetMetadata) {
  if (ds.attrs?.featureType === undefined) return false;
  return ["trajectory", "trajectoryProfile"].includes(ds.attrs?.featureType);
}
