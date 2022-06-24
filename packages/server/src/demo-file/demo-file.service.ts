import { Injectable, Logger } from "@nestjs/common";
import { DemoFile } from "@prisma/client";
import { Subject, concatMap, tap } from "rxjs";
import { FilesystemService } from "../filesystem/filesystem.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DemoFileService {
  private readonly logger = new Logger(DemoFileService.name);

  private readonly unparsedDemoFileSubject = new Subject<{
    demoFile: DemoFile;
  }>();
  readonly unparsedDemoFileObservable = this.unparsedDemoFileSubject.pipe(
    tap(({ demoFile }) =>
      this.logger.verbose(`emitting ${demoFile.filepath} for parsing`)
    )
  );

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
                  this.unparsedDemoFileSubject.next({ demoFile });
                } else if (existingDemoFile.isDeleted) {
                  const demoFile =
                    await this.prismaService.client.demoFile.update({
                      where: { filepath },
                      data: {
                        fileCreated,
                        fileUpdated,
                        isDeleted: false,
                        isParsed: false,
                      },
                    });
                  this.unparsedDemoFileSubject.next({ demoFile });
                }
                break;
              }
              case "change": {
                if (existingDemoFile) {
                  const demoFile =
                    await this.prismaService.client.demoFile.update({
                      where: { filepath },
                      data: { fileUpdated, isParsed: false },
                    });
                  this.unparsedDemoFileSubject.next({ demoFile });
                }
                break;
              }
              case "delete": {
                if (existingDemoFile) {
                  await this.prismaService.client.demoFile.update({
                    where: { filepath },
                    data: { isDeleted: true },
                  });
                }
              }
            }
          }
        })
      )
      .subscribe();
  }
}
