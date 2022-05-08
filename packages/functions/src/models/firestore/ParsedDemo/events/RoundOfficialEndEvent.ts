import { BaseRoundEvent } from "./BaseRoundEvent";

export interface RoundOfficialEndEvent extends BaseRoundEvent {
  eventKind: "RoundOfficialEndEvent";
}
