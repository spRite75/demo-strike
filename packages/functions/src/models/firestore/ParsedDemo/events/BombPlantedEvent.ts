import { BaseRoundEvent } from "./BaseRoundEvent";

export interface BombPlantedEvent extends BaseRoundEvent {
  eventKind: "BombPlantedEvent";
  planter: { steamId: string; name: string };
  location: string;
}
