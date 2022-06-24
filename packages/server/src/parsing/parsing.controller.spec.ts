import { Test, TestingModule } from "@nestjs/testing";
import { ParsingController } from "./parsing.controller";
import { ParsingService } from "./parsing.service";

describe("ParsingController", () => {
  let controller: ParsingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParsingController],
    })
      .useMocker((token) => ({}))
      .compile();

    controller = module.get<ParsingController>(ParsingController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
