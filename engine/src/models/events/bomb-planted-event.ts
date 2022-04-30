import { BaseRoundEvent } from "./base-round-event"

export interface BombPlantedEvent extends BaseRoundEvent {
    eventKind: "BombPlantedEvent"
    planter: { steamId: string, name: string }
}
