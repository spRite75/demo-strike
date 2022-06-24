import {
  Request,
  Body,
  Controller,
  HttpCode,
  Post,
  UseGuards,
  Get,
} from "@nestjs/common";
import { LocalUser } from "@prisma/client";
import { IsNotEmpty } from "class-validator";
import { runInThisContext } from "vm";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt.guard";
import { LocalAuthGuard } from "./local.guard";

export class RegisterRequest {
  @IsNotEmpty()
  username: string = "";
  @IsNotEmpty()
  password: string = "";
}

export class LogInRequest {
  @IsNotEmpty()
  username: string = "";
  @IsNotEmpty()
  password: string = "";
}

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  register(@Body() registerRequest: RegisterRequest) {
    return this.authService.register(registerRequest);
  }

  @UseGuards(LocalAuthGuard)
  @Post("logIn")
  @HttpCode(200)
  logIn(@Request() req: Express.Request) {
    const user = req.user as unknown as LocalUser;
    return this.authService.logIn(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  getMe(@Request() req: Express.Request) {
    return req.user;
  }
}
