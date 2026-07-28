import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

const STATUSES = ["draft", "published"];

export class CreateExhibitDto {
  @IsString()
  @MaxLength(500)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(600)
  summary?: string;

  @IsString()
  body!: string;

  @IsUUID()
  @IsOptional()
  coverMediaId?: string;
}

export class UpdateExhibitDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(600)
  summary?: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsUUID()
  @IsOptional()
  coverMediaId?: string;

  @IsIn(STATUSES)
  @IsOptional()
  status?: "draft" | "published";
}
