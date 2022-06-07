import { DateTime } from "luxon";

export function renderTimestamp(
  timestamp: string,
  output: "full" | "day+month"
) {
  const dateTime = DateTime.fromISO(timestamp).setZone("local");
  switch (output) {
    case "full":
      return dateTime.toFormat("dd LLL yyyy '@' HH:mm");
    case "day+month":
      return dateTime.toFormat("dd LLL");
  }
}
