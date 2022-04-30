import { Injectable } from '@nestjs/common';
import { LoadingService } from 'src/loading/loading.service';
import { ParsingService } from 'src/parsing/parsing.service';

@Injectable()
export class AnalyserService {
    constructor(private readonly loadingService: LoadingService, private readonly parsingService: ParsingService) {}

    async analyse() {
        const demo = this.loadingService.loadDemo()
        const parsed = await this.parsingService.parseDemo(demo)
        parsed.print()
    }
}
