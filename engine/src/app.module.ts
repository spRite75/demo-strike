import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ParsingService } from './parsing/parsing.service';
import { LoadingService } from './loading/loading.service';
import { AnalyserService } from './analyser/analyser.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.${process.env.ACTIVE_PROFILE || 'local'}.env`,
      ignoreEnvFile: process.env.ACTIVE_PROFILE === 'live'
    }),
  ],
  controllers: [AppController],
  providers: [AppService, ParsingService, LoadingService, AnalyserService],
})
export class AppModule {}
