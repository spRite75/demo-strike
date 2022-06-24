import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mkdirSync, Stats } from "fs";
import * as chokidar from "chokidar";
import { bufferTime, filter, Subject, tap } from "rxjs";

@Injectable()
export class FilesystemService {
  private readonly logger = new Logger(FilesystemService.name);
  private readonly demosDir = this.configService.getOrThrow(
    "FILESYSTEM_DEMOS_ROOT"
  );
  private readonly demosWatcher: chokidar.FSWatcher;

  private readonly demoFileSubject = new Subject<{
    event: "add" | "change" | "delete";
    filepath: string;
    stats?: Stats;
  }>();
  readonly demoFileObservable = this.demoFileSubject
    .asObservable()
    .pipe(
      tap(({ event, filepath }) => this.logger.verbose(`${event} ${filepath}`))
    )
    .pipe(bufferTime(1000))
    .pipe(filter((i) => i.length > 0));

  constructor(private configService: ConfigService) {
    // Watch demos directory
    mkdirSync(this.demosDir, { recursive: true });
    this.demosWatcher = chokidar.watch(this.demosDir, {
      alwaysStat: true,
      awaitWriteFinish: true,
    });

    this.demosWatcher.on("add", async (filepath, stats) => {
      if (filepath.endsWith(".dem") || filepath.endsWith(".dem.info")) {
        this.demoFileSubject.next({ event: "add", filepath, stats });
      }
    });

    this.demosWatcher.on("change", async (filepath, stats) => {
      if (filepath.endsWith(".dem") || filepath.endsWith(".dem.info")) {
        this.demoFileSubject.next({ event: "change", filepath, stats });
      }
    });

    this.demosWatcher.on("unlink", async (filepath) => {
      if (filepath.endsWith(".dem") || filepath.endsWith(".dem.info")) {
        this.demoFileSubject.next({ event: "delete", filepath });
      }
    });
  }
}
