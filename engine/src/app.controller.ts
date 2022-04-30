import { Controller, Get } from '@nestjs/common';
import { AnalyserService } from './analyser/analyser.service';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly analyserService: AnalyserService) {}

  @Get()
  async getHello(): Promise<string> {
    await this.analyserService.analyse();
    return this.appService.getHello();
  }
}
