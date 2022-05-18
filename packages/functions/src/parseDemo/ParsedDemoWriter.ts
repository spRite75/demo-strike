import { IPlayerRoundStats } from "demofile";
import {
  ParsedDemoDocument,
  ParsedDemoDocument_round,
  ParsedDemoDocument_round_event,
  ParsedDemoDocument_team_player,
  ParsedDemoDocument_team_player_score,
  ParsedDemoDocument_team_score,
  TeamLetter,
} from "../models/firestore/ParsedDemo";

export class ParsedDemoWriter {
  private demo: ParsedDemoDocument = {
    playersSteam64Ids: [],
    teams: [],
    rounds: [],
    mapName: "",
    serverName: "",
    playbackTicks: 0,
    playbackTime: 0,
    steamworksSessionIdServer: "",
  };

  private players: (ParsedDemoDocument_team_player & {
    finalTeamLetter?: TeamLetter;
  })[] = [];

  private getRound(roundNumber: number): ParsedDemoDocument_round {
    const round = this.demo.rounds.find(
      (round) => round.roundNumber === roundNumber
    );
    if (!round) {
      this.demo.rounds.push({ roundNumber, events: [] });
      return this.getRound(roundNumber);
    }
    return round;
  }

  private getPlayer(steam64Id: string) {
    return this.players.find((player) => player.steam64Id === steam64Id);
  }

  // Adds a player if they haven't been addeed already
  addPlayer(steam64Id: string, displayName: string) {
    if (!this.getPlayer(steam64Id))
      this.players.push({
        steam64Id,
        displayName,
        playerScore: { assists: 0, deaths: 0, kills: 0, score: 0, mvps: 0 },
        playerRoundStats: [],
      });
  }

  updatePlayerScore(
    steam64Id: string,
    updater: (
      currentScore: ParsedDemoDocument_team_player_score
    ) => ParsedDemoDocument_team_player_score
  ) {
    const player = this.getPlayer(steam64Id);
    if (!player) return;
    player.playerScore = updater(player.playerScore);
  }

  addPlayerRoundStats(
    steam64Id: string,
    roundNumber: number,
    stats: IPlayerRoundStats
  ) {
    const player = this.getPlayer(steam64Id);
    if (!player) return;
    player.playerRoundStats.push({ roundNumber, ...stats });
  }

  setPlayerTeam(steam64Id: string, phase: string, teamLetter: TeamLetter) {
    const player = this.getPlayer(steam64Id);
    if (!player) return;
    switch (phase) {
      case "first":
        switch (teamLetter) {
          case "CT":
            player.finalTeamLetter = "T";
            break;
          case "T":
            player.finalTeamLetter = "CT";
            break;
        }
        break;
      case "second":
        player.finalTeamLetter = teamLetter;
        break;
    }
  }

  recordEvent(roundNumber: number, event: ParsedDemoDocument_round_event) {
    const round = this.getRound(roundNumber);
    round.events.push(event);
  }

  finalise(opts: {
    finalTeamScores: {
      CT: ParsedDemoDocument_team_score;
      T: ParsedDemoDocument_team_score;
    };
    mapName: string;
    serverName: string;
    playbackTicks: number;
    playbackTime: number;
    steamworksSessionIdServer: string;
  }) {
    const {
      finalTeamScores,
      mapName,
      serverName,
      playbackTicks,
      playbackTime,
      steamworksSessionIdServer,
    } = opts;

    // Set ParsedDemo ID and other metadata
    this.demo.mapName = mapName;
    this.demo.serverName = serverName;
    this.demo.playbackTicks = playbackTicks;
    this.demo.playbackTime = playbackTime;
    this.demo.steamworksSessionIdServer = steamworksSessionIdServer;

    // Create teams and add players
    this.demo.teams.push(
      {
        finalTeamLetter: "CT",
        players: this.players.filter(
          (player) => player.finalTeamLetter === "CT"
        ),
        score: finalTeamScores.CT,
      },
      {
        finalTeamLetter: "T",
        players: this.players.filter(
          (player) => player.finalTeamLetter === "T"
        ),
        score: finalTeamScores.T,
      }
    );

    // Set list of steam64Ids in the match
    this.demo.playersSteam64Ids = this.players.map(
      (player) => player.steam64Id
    );
  }

  get() {
    return this.demo;
  }
}
