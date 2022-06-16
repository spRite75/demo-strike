import { Test, TestingModule } from '@nestjs/testing';
import { SteamWebApiService } from './steam-web-api.service';

describe('SteamWebApiService', () => {
  let service: SteamWebApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SteamWebApiService],
    }).compile();

    service = module.get<SteamWebApiService>(SteamWebApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
