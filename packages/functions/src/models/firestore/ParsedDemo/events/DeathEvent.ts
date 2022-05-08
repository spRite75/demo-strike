import { TeamLetter } from "../TeamLetter";
import { BaseRoundEvent } from "./BaseRoundEvent";

export interface DeathEvent extends BaseRoundEvent {
  eventKind: "DeathEvent";
  attacker: { steamId: string; name: string; team: TeamLetter };
  victim: { steamId: string; name: string; team: TeamLetter };
  weapon: string;
}
