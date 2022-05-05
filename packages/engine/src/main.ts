import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { resolve } from 'path';
import * as dotenv from 'dotenv';
if (process.env.ACTIVE_PROFILE !== 'live') {
  dotenv.config({
    path: resolve(
      process.cwd(),
      `.${process.env.ACTIVE_PROFILE || 'local'}.env`,
    ),
  });
}

console.log(process.env)

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
