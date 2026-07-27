import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

const CATEGORIES = ["Оголошення", "Події", "Пам'ятні дати", "Оновлення платформи"] as const;
const STATUSES = ["draft", "published"] as const;

export class UpdateNewsDto {
  @IsString()
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @IsIn(CATEGORIES)
  @IsOptional()
  category?: (typeof CATEGORIES)[number];

  @IsString()
  @MaxLength(400)
  @IsOptional()
  excerpt?: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsIn(STATUSES)
  @IsOptional()
  status?: (typeof STATUSES)[number];
}
