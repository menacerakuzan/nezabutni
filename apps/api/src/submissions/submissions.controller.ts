import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { SubmissionsService } from "./submissions.service";
import { CreateSubmissionDto } from "./dto/create-submission.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser, CurrentUserPayload } from "../auth/current-user.decorator";

@UseGuards(JwtAuthGuard)
@Controller("submissions")
export class SubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

  @Post()
  create(@Body() dto: CreateSubmissionDto, @CurrentUser() user: CurrentUserPayload) {
    return this.submissions.create(dto, user.userId);
  }

  @Get("mine")
  listMine(@CurrentUser() user: CurrentUserPayload) {
    return this.submissions.listMine(user.userId);
  }
}
