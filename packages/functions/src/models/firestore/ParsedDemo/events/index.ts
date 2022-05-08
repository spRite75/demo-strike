import { BombPlantedEvent } from "./BombPlantedEvent";
import { DeathEvent } from "./DeathEvent";
import { RoundEndEvent } from "./RoundEndEvent";
import { RoundOfficialEndEvent } from "./RoundOfficialEndEvent";
import { RoundStartEvent } from "./RoundStartEvent";

export type RoundEvent =
  | DeathEvent
  | BombPlantedEvent
  | RoundStartEvent
  | RoundEndEvent
  | RoundOfficialEndEvent;
