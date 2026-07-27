import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class UpdateMenuItemDto {
  @IsBoolean()
  @IsOptional()
  visible?: boolean;

  @IsInt()
  @Min(0)
  @Max(999)
  @IsOptional()
  sortOrder?: number;

  @IsString()
  @MaxLength(120)
  @IsOptional()
  label?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  href?: string;
}
