import SteamID from "steamid";
import { CDataGCCStrike15V2MatchInfo } from "demofile/dist/protobufs/cstrike15_gcmessages";
import { DateTime } from "luxon";

export interface ParsedInfo {
  officialMatchId: string;
  officialMatchTimestamp: string;
  steam64Ids: string[];
}

export function parseInfo(infoBuffer: Buffer): ParsedInfo {
  const demofileMessage = CDataGCCStrike15V2MatchInfo.decode(infoBuffer);
  const { matchid, matchtime, roundstatsall } = demofileMessage;

  const steam64Ids =
    roundstatsall[roundstatsall.length - 1]?.reservation?.accountIds.map(
      (steam3Id) => new SteamID(`[U:1:${steam3Id}]`).getSteamID64()
    ) ?? [];

  return {
    officialMatchId: matchid.toString(),
    officialMatchTimestamp: DateTime.fromSeconds(matchtime).toISO(),
    steam64Ids,
  };
}
