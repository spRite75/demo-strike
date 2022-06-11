import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { hash, compare } from "bcrypt";

import { PrismaService } from "src/prisma/prisma.service";
import { LogInRequest, RegisterRequest } from "./auth.controller";

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(private prismaService: PrismaService) {}

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

  async logIn({ username, password }: LogInRequest) {
    const user = await this.prismaService.client.localUser.findUnique({
      where: { username },
    });

    const isMatch = !!user && (await compare(password, user.password));

    if (!isMatch)
      throw new HttpException(
        "Invalid username or password",
        HttpStatus.UNAUTHORIZED
      );

    return "Welcome " + user.username;
  }
}
