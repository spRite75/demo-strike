import { BaseRoundEvent } from "./base-round-event";

export interface RoundOfficialEndEvent extends BaseRoundEvent {
    eventKind: "RoundOfficialEndEvent"
}
