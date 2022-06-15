import { Controller, Res, Req, Next, All } from "@nestjs/common";
import { ApolloServer } from "apollo-server-cloud-functions";
import { Request, Response, NextFunction } from "express";
import { typeDefs } from "./typeDefs";
import { resolvers } from "./resolvers";
import { createContext } from "./context";
import { PrismaService } from "src/prisma/prisma.service";

@Controller("graphql")
export class GraphqlController {
  constructor(private prismaService: PrismaService) {}
  private readonly server = new ApolloServer({
    typeDefs,
    resolvers,
    context: createContext({ prisma: this.prismaService }),
  });
  private readonly handler = this.server.createHandler();

  @All()
  handle(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction
  ) {
    return this.handler(req, res, next);
  }
}
