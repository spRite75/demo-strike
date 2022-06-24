import { Test, TestingModule } from "@nestjs/testing";
import { Subject } from "rxjs";
import { DemoFileService } from "../demo-file/demo-file.service";
import { PrismaService } from "../prisma/prisma.service";
import { SteamWebApiService } from "../steam-web-api/steam-web-api.service";
import { ParsingService } from "./parsing.service";

describe("ParsingService", () => {
  let service: ParsingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParsingService],
    })
      .useMocker((token) => {
        switch (token) {
          case DemoFileService: {
            const mock: Partial<DemoFileService> = {
              unparsedDemoFileObservable: new Subject(),
            };
            return mock;
          }
        }
        return {};
      })
      .compile();

    service = module.get<ParsingService>(ParsingService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
