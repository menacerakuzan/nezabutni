import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

const CATEGORIES = ["Оголошення", "Події", "Пам'ятні дати", "Оновлення платформи"] as const;

export class CreateNewsDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsIn(CATEGORIES)
  category!: (typeof CATEGORIES)[number];

  @IsString()
  @MaxLength(400)
  @IsOptional()
  excerpt?: string;

  @IsString()
  body!: string;
}
