import { Injectable } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { FilesystemService } from "src/filesystem/filesystem.service";
import { PrismaService } from "src/prisma/prisma.service";

import { bufferTime, filter } from "rxjs";
import { DemoFileService } from "src/demo-file/demo-file.service";

@Injectable()
export class ParsingService {
  constructor(demoFileService: DemoFileService) {
    demoFileService.unparsedDemoFileObservable.subscribe({
      next: ({ filepath }) => {
        console.log("would parse", filepath);
      },
    });
  }
}
