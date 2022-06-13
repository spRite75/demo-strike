import { Injectable } from "@nestjs/common";
import { DemoFile } from "@prisma/client";
import { Subject, bufferTime, concatMap, filter } from "rxjs";
import { FilesystemService } from "src/filesystem/filesystem.service";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class DemoFileService {
  private readonly unparsedDemoFileSubject = new Subject<DemoFile>();
  readonly unparsedDemoFileObservable =
    this.unparsedDemoFileSubject.asObservable();

  constructor(
    filesystemService: FilesystemService,
    private prismaService: PrismaService
  ) {
    filesystemService.demoFileObservable
      .pipe(
        // Use concat map to preserve processing order with async/await
        concatMap(async (fileEvents) => {
          for (const fileEvent of fileEvents) {
            const { filepath } = fileEvent;
            const existingDemoFile =
              await this.prismaService.client.demoFile.findUnique({
                where: { filepath },
              });

            switch (fileEvent.event) {
              case "add": {
                if (!existingDemoFile) {
                  const demoFile =
                    await this.prismaService.client.demoFile.create({
                      data: { filepath },
                    });
                  this.unparsedDemoFileSubject.next(demoFile);
                } else if (existingDemoFile.deleted) {
                  const demoFile =
                    await this.prismaService.client.demoFile.update({
                      where: { filepath },
                      data: { deleted: false, parsed: false },
                    });
                  this.unparsedDemoFileSubject.next(demoFile);
                }
                break;
              }
              case "change": {
                if (existingDemoFile) {
                  const demoFile =
                    await this.prismaService.client.demoFile.update({
                      where: { filepath },
                      data: { parsed: false },
                    });
                  this.unparsedDemoFileSubject.next(demoFile);
                }
                break;
              }
              case "delete": {
                if (existingDemoFile) {
                  await this.prismaService.client.demoFile.update({
                    where: { filepath },
                    data: { deleted: true },
                  });
                }
              }
            }
          }
        })
      )
      .subscribe();
  }

  private async getExisitingDemoFile(filepath: string) {
    return;
  }
}
