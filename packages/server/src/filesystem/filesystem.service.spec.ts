import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { FilesystemService } from "./filesystem.service";

describe("FilesystemService", () => {
  let service: FilesystemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FilesystemService],
    })
      .useMocker((token) => {
        switch (token) {
          case ConfigService: {
            return {
              getOrThrow() {
                return "something";
              },
            };
          }
        }
      })
      .compile();

    service = module.get<FilesystemService>(FilesystemService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
