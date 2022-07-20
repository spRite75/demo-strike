import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as chokidar from "chokidar";
import { mkdirSync, Stats } from "fs";
import { PrismaService } from "../prisma/prisma.service";
import { DiskFile, DiskFileKind } from "@prisma/client";
import { bufferTime, filter, Subject } from "rxjs";

@Injectable()
export class DiskFileService {
  private readonly demosDir = this.configService.getOrThrow(
    "FILESYSTEM_DEMOS_ROOT"
  );
  private readonly demosWatcher: chokidar.FSWatcher;

  private readonly diskFileSubject = new Subject<DiskFile>();
  readonly unprocessedDiskFiles = this.diskFileSubject
    .asObservable()
    .pipe(filter(({ isProcessed }) => !isProcessed));

  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService
  ) {
    // Watch demos directory
    mkdirSync(this.demosDir, { recursive: true });
    this.demosWatcher = chokidar.watch(this.demosDir, {
      alwaysStat: true,
      awaitWriteFinish: true,
    });

    this.demosWatcher.on("add", (filepath, stats) => {
      this.handleDiskFileEvent({ event: "add", filepath, stats });
    });

    this.demosWatcher.on("change", async (filepath, stats) => {
      this.handleDiskFileEvent({ event: "change", filepath, stats });
    });

    this.demosWatcher.on("unlink", async (filepath) => {
      this.handleDiskFileEvent({ event: "delete", filepath });
    });
  }

  private async handleDiskFileEvent({
    event,
    filepath,
    stats,
  }: {
    event: "add" | "change" | "delete";
    filepath: string;
    stats?: Stats;
  }) {
    const fileCreated = stats?.ctime ?? new Date(0);
    const fileUpdated = stats?.mtime ?? new Date(0);
    const diskFileKind = inferDiskFileKindFromFileExtension(filepath);
    if (diskFileKind === DiskFileKind.UNKNOWN) return;

    const existingDiskFile =
      await this.prismaService.client.diskFile.findUnique({
        where: { filepath },
      });

    let updatedDiskFile: DiskFile | null = null;
    switch (event) {
      case "add": {
        if (!existingDiskFile) {
          updatedDiskFile = await this.prismaService.client.diskFile.create({
            data: {
              fileCreated,
              fileUpdated,
              filepath,
            },
          });
        } else if (existingDiskFile.isDeleted) {
          updatedDiskFile = await this.prismaService.client.diskFile.update({
            where: { filepath },
            data: {
              fileCreated,
              fileUpdated,
              isDeleted: false,
              isProcessed: false,
            },
          });
        }
        break;
      }
      case "change": {
        if (existingDiskFile) {
          updatedDiskFile = await this.prismaService.client.diskFile.update({
            where: { filepath },
            data: { fileUpdated, isProcessed: false },
          });
        }
        break;
      }
      case "delete": {
        if (existingDiskFile) {
          await this.prismaService.client.diskFile.update({
            where: { filepath },
            data: { isDeleted: true },
          });
        }
      }
    }

    if (updatedDiskFile) {
    }
  }
}

function inferDiskFileKindFromFileExtension(filepath: string): DiskFileKind {
  return filepath.endsWith(".dem")
    ? DiskFileKind.DEMO
    : filepath.endsWith(".dem.info")
    ? DiskFileKind.DEMO_INFO
    : DiskFileKind.UNKNOWN;
}
