import { RoundEvent } from "./events"

export class Round {
    private events: RoundEvent[] = []

    constructor(public readonly roundNumber: number) {}

    addEvent(event: RoundEvent) {
        this.events.push(event)
    }

    print() {
        this.events.sort((a, b) => a.eventTime - b.eventTime).forEach(this.printEvent)
    }

    private printEvent(event: RoundEvent) {
        switch (event.eventKind) {
            case "RoundStartEvent":
                console.log(`Round ${event.roundNumber} started`)
                break;
            case "DeathEvent":
                console.log(`${event.attacker.name} (${event.attacker.team}) killed ${event.victim.name} (${event.victim.team}) with ${event.weapon}`)
                break;
            case "BombPlantedEvent":
                console.log(`${event.planter.name} planted the bomb at ${event.location}`)
                break;
            case "RoundEndEvent":
                console.log(`Round ended. Phase: ${event.phase}, Reason: ${event.reason}`)
                break;
            case "RoundOfficialEndEvent":
                console.log(`Round fully over, preparing new round.`)
        }
    }
}
