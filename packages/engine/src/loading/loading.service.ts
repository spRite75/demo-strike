import { Injectable } from '@nestjs/common';

import { createReadStream } from 'fs';

@Injectable()
export class LoadingService {

    loadDemo() {
        return createReadStream("./sample_demos/sample_1.dem")
    }
}
