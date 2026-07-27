import { IsOptional, IsString, MaxLength } from "class-validator";

/** Лише ці ключі можна редагувати з адмінки — білий список проти сміття в site_setting. */
export class UpdateSettingsDto {
  @IsString()
  @MaxLength(120)
  @IsOptional()
  siteName?: string;

  @IsString()
  @MaxLength(300)
  @IsOptional()
  tagline?: string;

  @IsString()
  @MaxLength(320)
  @IsOptional()
  contactEmail?: string;
}
