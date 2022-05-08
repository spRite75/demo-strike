import { BaseRoundEvent } from "./BaseRoundEvent";

export interface RoundStartEvent extends BaseRoundEvent {
  eventKind: "RoundStartEvent";
  roundNumber: number;
}
