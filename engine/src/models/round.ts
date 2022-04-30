import { RoundEvent } from "./events"

export interface Round {
    roundNumber: number
    events: RoundEvent[]
}
