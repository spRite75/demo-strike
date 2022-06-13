import { Test, TestingModule } from '@nestjs/testing';
import { DemoFileService } from './demo-file.service';

describe('DemoFileService', () => {
  let service: DemoFileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DemoFileService],
    }).compile();

    service = module.get<DemoFileService>(DemoFileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
