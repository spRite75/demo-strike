import { BaseRoundEvent } from "./base-round-event";

export interface RoundEndEvent extends BaseRoundEvent {
    eventKind: "RoundEndEvent"
}
