import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { DiskFileService } from "./disk-file.service";

describe("DiskFileService", () => {
  let service: DiskFileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiskFileService],
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

    service = module.get<DiskFileService>(DiskFileService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
