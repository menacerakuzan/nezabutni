import { IsString, MaxLength } from "class-validator";

export class RoleCodeDto {
  @IsString()
  @MaxLength(30)
  role!: string;
}
