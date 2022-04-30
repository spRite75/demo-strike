import { RoundEvent } from "./events"
import { Player } from "./player"
import { Round } from "./round"

export class Match {
    players: Player[] = []
    rounds: Round[] = []

    private getRound(roundNumber: number): Round {
        const round = this.rounds.find((round) => round.roundNumber === roundNumber)
        if (!round) {
            this.rounds.push({roundNumber, events: []})
            return this.getRound(roundNumber)
        }
        return round
    }

    recordEvent(roundNumber: number, event: RoundEvent) {
        const round = this.getRound(roundNumber)
        round.events.push(event)
    }

    logRounds() {
        const roundNumbers = Object.keys(this.rounds).map(num => parseInt(num))
        console.log(`Logging data for ${roundNumbers.length} rounds...`)
        this.rounds.forEach(round => {
            console.log("\n")
            console.log(`Starting Round ${round.roundNumber}:`)
            round.events.forEach(event => {
                switch (event.eventKind) {
                    case "DeathEvent":
                        console.log(`${event.attacker.name} (${event.attacker.team}) killed ${event.victim.name} (${event.victim.team}) with ${event.weapon}`)
                        break;
                    case "BombPlantedEvent":
                        console.log(`${event.planter.name} planted the bomb`)
                        break;
                }
            })
            console.log(`End of Round ${round.roundNumber}.`)
        })
    }
}
