import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import minMax from "dayjs/plugin/minMax";
import type { ManipulateType } from "dayjs";

dayjs.extend(utc);
dayjs.extend(minMax);

const unitsRegEx = /([a-zA-Z]+) since (.+)$/;

export function hasUnits(
  maybeHasUnits: { units: string } | unknown,
): maybeHasUnits is { units: string } {
  return typeof maybeHasUnits?.units === "string";
}

function isInterval(maybeInterval: string): maybeInterval is ManipulateType {
  return ["milliseconds", "seconds", "minutes", "hours", "days"].includes(
    maybeInterval,
  );
}

export function parseTimeUnits(
  units: string,
): { interval: ManipulateType; refdate: string } | undefined {
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
  const { interval, refdate } = timeUnits;
  const ref = dayjs.utc(refdate);
  const timepoint = ref.add(value, interval);
  return timepoint;
}
