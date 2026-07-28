import { IsDateString, IsLatitude, IsLongitude, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class UpdateDefenderDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  fullName?: string;

  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @IsDateString()
  @IsOptional()
  deathDate?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsUUID()
  @IsOptional()
  portraitMediaId?: string;

  // Точка на Полі вогнів (місце народження) — адмін може виправити
  // вручну, якщо автогеокодинг за текстом біографії помилився.
  @IsLongitude()
  @IsOptional()
  lon?: number;

  @IsLatitude()
  @IsOptional()
  lat?: number;
}
