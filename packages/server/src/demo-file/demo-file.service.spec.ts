import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { FilesystemService } from "../filesystem/filesystem.service";
import { DemoFileService } from "./demo-file.service";
import { Subject } from "rxjs";

describe("DemoFileService", () => {
  let service: DemoFileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DemoFileService],
    })
      .useMocker((token) => {
        switch (token) {
          case FilesystemService: {
            return <Partial<FilesystemService>>{
              demoFileObservable: new Subject(),
            };
          }
        }

        return {};
      })
      .compile();

    service = module.get<DemoFileService>(DemoFileService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
