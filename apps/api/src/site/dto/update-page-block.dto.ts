import { IsBoolean, IsInt, IsObject, IsOptional, Max, Min } from "class-validator";

export class UpdatePageBlockDto {
  @IsBoolean()
  @IsOptional()
  visible?: boolean;

  @IsInt()
  @Min(0)
  @Max(999)
  @IsOptional()
  sortOrder?: number;

  @IsObject()
  @IsOptional()
  props?: Record<string, unknown>;
}
