import { BaseRoundEvent } from "./base-round-event";

export interface RoundStartEvent extends BaseRoundEvent {
    eventKind: "RoundStartEvent"
    roundNumber: number
}