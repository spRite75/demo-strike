import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { LocalUser } from "@prisma/client";
import { hash, compare } from "bcrypt";

import { PrismaService } from "../prisma/prisma.service";
import { LogInRequest, RegisterRequest } from "./auth.controller";

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService
  ) {}

  async register({ username, password }: RegisterRequest) {
    const existingUser = await this.prismaService.client.localUser.findUnique({
      where: { username },
    });

    if (existingUser)
      throw new HttpException("username taken", HttpStatus.BAD_REQUEST);

    await this.prismaService.client.localUser.create({
      data: { username, password: await hash(password, this.saltRounds) },
    });
  }

  async validateUser({ username, password }: LogInRequest): Promise<LocalUser> {
    const user = await this.prismaService.client.localUser.findUnique({
      where: { username },
    });

    const isMatch = !!user && (await compare(password, user.password));

    if (!isMatch)
      throw new HttpException(
        "Invalid username or password",
        HttpStatus.UNAUTHORIZED
      );

    return { ...user, password: "" };
  }

  logIn(user: LocalUser) {
    return {
      access_token: this.jwtService.sign({
        username: user.username,
        sub: user.id,
      }),
    };
  }
}
