import { BaseRoundEvent } from "./base-round-event";

export interface RoundEndEvent extends BaseRoundEvent {
    eventKind: "RoundEndEvent"
    phase: string
    reason: string
}
