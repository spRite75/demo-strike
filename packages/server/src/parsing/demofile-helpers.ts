import { BaseEntity, DemoFile, Player } from "demofile";
import { ParsedMatchPlayer, ParsedMatchPlayerScore } from "./parsing.service";

export type SiteLetter = "A" | "B" | "???";

enum DemoRoundEndReason {
  TargetBombed = 1, // Target Successfully Bombed!
  // 2/3 not in use in CSGO
  TerroristsEscaped = 4, // The terrorists have escaped!
  CTStoppedEscape = 5, // The CTs have prevented most of the terrorists from escaping!
  TerroristsStopped = 6, // Escaping terrorists have all been neutralized!
  BombDefused = 7, // The bomb has been defused!
  CTWin = 8, // Counter-Terrorists Win!
  TerroristWin = 9, // Terrorists Win!
  Draw = 10, // Round Draw!
  HostagesRescued = 11, // All Hostages have been rescued!
  TargetSaved = 12, // Target has been saved!
  HostagesNotRescued = 13, // Hostages have not been rescued!
  TerroristsNotEscaped = 14, // Terrorists have not escaped!
  GameStart = 16, // Game Commencing!
  // 15 not in use in CSGO
  TerroristsSurrender = 17, // Terrorists Surrender
  CTSurrender = 18, // CTs Surrender
  TerroristsPlanted = 19, // Terrorists Planted the bomb
  CTsReachedHostage = 20, // CTs Reached the hostage
}

export type RoundEndReason =
  | "TargetBombed"
  | "BombDefused"
  | "CTWin"
  | "TerroristWin"
  | "Draw"
  | "HostagesRescued"
  | "HostagesNotRescued"
  | "GameStart"
  | "TerroristsSurrender"
  | "CTSurrender"
  | "Unknown";
export function getRoundEndReason(
  reasonValue: DemoRoundEndReason
): RoundEndReason {
  switch (reasonValue) {
    case DemoRoundEndReason.TargetBombed:
      return "TargetBombed";
    case DemoRoundEndReason.BombDefused:
      return "BombDefused";
    case DemoRoundEndReason.CTWin:
      return "CTWin";
    case DemoRoundEndReason.TerroristWin:
      return "TerroristWin";
    case DemoRoundEndReason.Draw:
      return "Draw";
    case DemoRoundEndReason.HostagesRescued:
      return "HostagesRescued";
    case DemoRoundEndReason.HostagesNotRescued:
      return "HostagesNotRescued";
    case DemoRoundEndReason.GameStart:
      return "GameStart";
    case DemoRoundEndReason.TerroristsSurrender:
      return "TerroristsSurrender";
    case DemoRoundEndReason.CTSurrender:
      return "CTSurrender";
    default:
      return "Unknown";
  }
}

export type TeamLetter = "T" | "CT" | "???";
export function getTeamLetter(teamNumber?: number): TeamLetter {
  switch (teamNumber) {
    case 2:
      return "T";
    case 3:
      return "CT";
    default:
      return "???";
  }
}

interface EntityLocation {
  x: number;
  y: number;
  z: number;
  name: string;
}
export function getLocation(entity: BaseEntity | Player): EntityLocation {
  return {
    ...entity.position,
    name: entity instanceof Player ? entity.placeName : "",
  };
}

export function getPlayerFinalTeamLetter(
  demoFile: DemoFile,
  player: Player
): TeamLetter {
  const playerCurrentTeamLetter = getTeamLetter(player.team?.teamNumber);

  // TODO: if we want to handle faceit / demos with overtime, this needs testing + more brain
  switch (demoFile.gameRules.phase) {
    case "first":
      switch (playerCurrentTeamLetter) {
        case "CT":
          return "T";
        case "T":
          return "CT";
        default:
          return "???";
      }
    case "second":
      return playerCurrentTeamLetter;
    default:
      return "???";
  }
}

export function extractPlayerScore(demoPlayer: Player): ParsedMatchPlayerScore {
  const playerHeadshotKills = demoPlayer.matchStats
    .map(({ headShotKills }) => headShotKills)
    .reduce((sum, curr) => sum + curr, 0);

  const kills = demoPlayer.kills;
  const assists = demoPlayer.assists;
  const deaths = demoPlayer.deaths;
  const headshotPercentage = `${
    ((playerHeadshotKills / kills) * 100).toFixed(2) || "--"
  }%`;
  return { kills, assists, deaths, headshotPercentage };
}
