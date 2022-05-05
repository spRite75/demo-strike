import { TeamLetter } from "../team-letter"
import { BaseRoundEvent } from "./base-round-event"

export interface DeathEvent extends BaseRoundEvent {
    eventKind: "DeathEvent"
    attacker: { steamId: string, name: string, team: TeamLetter}
    victim: { steamId: string, name: string, team: TeamLetter }
    weapon: string
}
