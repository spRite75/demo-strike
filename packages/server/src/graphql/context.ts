import { ContextFunction } from "apollo-server-core";
import { Request as ExpressRequest } from "express";
import { PrismaService } from "src/prisma/prisma.service";

export interface Context {
  server: string;
  prisma: PrismaService;
}

export function createContext(dependencies: {
  prisma: PrismaService;
}): ContextFunction<{ req: ExpressRequest }, Context> {
  const { prisma } = dependencies;
  return async ({ req }) => {
    return {
      server: "Apollo on NestJS",
      prisma,
    };
  };
}
