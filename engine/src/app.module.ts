import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ParsingService } from './parsing/parsing.service';
import { LoadingService } from './loading/loading.service';
import { AnalyserService } from './analyser/analyser.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ParsingService, LoadingService, AnalyserService],
})
export class AppModule {}
