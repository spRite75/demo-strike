import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { LocalStrategy } from "./auth/local.strategy";
import { PrismaService } from "./prisma/prisma.service";

@Module({
  imports: [PassportModule],
  controllers: [AppController, AuthController],
  providers: [AppService, AuthService, LocalStrategy, PrismaService],
})
export class AppModule {}
