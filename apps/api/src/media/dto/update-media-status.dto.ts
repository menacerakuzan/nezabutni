import { IsIn } from "class-validator";

const CONTENT_STATUSES = ["draft", "in_review", "published", "archived"];

export class UpdateMediaStatusDto {
  @IsIn(CONTENT_STATUSES)
  status!: "draft" | "in_review" | "published" | "archived";
}
