import { IsIn } from "class-validator";

export class SetStatusDto {
  @IsIn(["active", "suspended"])
  status!: "active" | "suspended";
}
