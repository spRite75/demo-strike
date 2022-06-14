import { Injectable } from "@nestjs/common";
import { DemoFile } from "@prisma/client";
import { Subject, concatMap } from "rxjs";
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
            const { filepath, stats } = fileEvent;
            const fileCreated = stats?.ctime ?? new Date(0);
            const fileUpdated = stats?.mtime ?? new Date(0);

            const existingDemoFile =
              await this.prismaService.client.demoFile.findUnique({
                where: { filepath },
              });

            switch (fileEvent.event) {
              case "add": {
                if (!existingDemoFile) {
                  const demoFile =
                    await this.prismaService.client.demoFile.create({
                      data: { filepath, fileCreated, fileUpdated },
                    });
                  this.unparsedDemoFileSubject.next(demoFile);
                } else if (existingDemoFile.deleted) {
                  const demoFile =
                    await this.prismaService.client.demoFile.update({
                      where: { filepath },
                      data: {
                        fileCreated,
                        fileUpdated,
                        deleted: false,
                        parsed: false,
                      },
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
                      data: { fileUpdated, parsed: false },
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
