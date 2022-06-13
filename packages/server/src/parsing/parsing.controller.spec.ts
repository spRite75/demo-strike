import { Test, TestingModule } from '@nestjs/testing';
import { ParsingController } from './parsing.controller';

describe('ParsingController', () => {
  let controller: ParsingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParsingController],
    }).compile();

    controller = module.get<ParsingController>(ParsingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
