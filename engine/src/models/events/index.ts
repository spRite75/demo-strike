import { BombPlantedEvent } from "./bomb-planted-event";
import { DeathEvent } from "./death-event";
import { RoundEndEvent } from "./round-end-event";
import { RoundOfficialEndEvent } from "./round-official-end-event";
import { RoundStartEvent } from "./round-start-event";

export type RoundEvent = 
  | DeathEvent
  | BombPlantedEvent
  | RoundStartEvent
  | RoundEndEvent
  | RoundOfficialEndEvent
