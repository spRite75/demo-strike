import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { IsNotEmpty } from "class-validator";
import { AuthService } from "./auth.service";

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

  @Post("logIn")
  @HttpCode(200)
  logIn(@Body() logInRequest: LogInRequest) {
    return this.authService.logIn(logInRequest);
  }
}
