import { Match } from "src/models/match";
import { Document } from "mongoose";
import { SchemaFactory } from "@nestjs/mongoose";

export type MatchDocument = Match & Document

export const MatchSchema = SchemaFactory.createForClass(Match)
