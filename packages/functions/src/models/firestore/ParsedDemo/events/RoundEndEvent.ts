import { BaseRoundEvent } from "./BaseRoundEvent";

export interface RoundEndEvent extends BaseRoundEvent {
  eventKind: "RoundEndEvent";
  phase: string;
  reason: string;
}
