import { Controller, Get } from "@nestjs/common";
import { ParsingService } from "./parsing.service";

@Controller("parsing")
export class ParsingController {
  constructor(private parsingService: ParsingService) {}

  @Get("trigger")
  trigger() {
    return this.parsingService.parseUnprocessed();
  }
}
