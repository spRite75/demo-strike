import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { SteamWebApiService } from "./steam-web-api.service";

describe("SteamWebApiService", () => {
  let service: SteamWebApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SteamWebApiService],
    })
      .useMocker((token) => {
        switch (token) {
          case ConfigService: {
            return {
              getOrThrow() {
                return "api-key";
              },
            };
          }
        }
      })
      .compile();

    service = module.get<SteamWebApiService>(SteamWebApiService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
