import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { jwtConstants } from "./auth/constants";
import { JwtStrategy } from "./auth/jwt.strategy";
import { LocalStrategy } from "./auth/local.strategy";
import { PrismaService } from "./prisma/prisma.service";
import { FilesystemService } from "./filesystem/filesystem.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ParsingService } from "./parsing/parsing.service";
import { ScheduleModule } from "@nestjs/schedule";
import { DemoFileService } from './demo-file/demo-file.service';
import { ParsingController } from './parsing/parsing.controller';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow("JWT_SECRET"),
        signOptions: { expiresIn: "60s" },
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController, AuthController, ParsingController],
  providers: [
    AppService,
    // Auth
    AuthService,
    LocalStrategy,
    JwtStrategy,
    // DB
    PrismaService,
    // Other
    FilesystemService,
    ParsingService,
    DemoFileService,
  ],
})
export class AppModule {}
