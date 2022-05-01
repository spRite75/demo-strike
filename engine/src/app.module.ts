import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ParsingService } from './parsing/parsing.service';
import { LoadingService } from './loading/loading.service';
import { AnalyserService } from './analyser/analyser.service';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(`${process.env.MONGODB_URL}`, {
      auth: {
        username: process.env.MONGODB_USER,
        password: process.env.MONGODB_PASSWORD,
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, ParsingService, LoadingService, AnalyserService],
})
export class AppModule {}
