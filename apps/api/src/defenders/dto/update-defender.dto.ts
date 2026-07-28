import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

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
}
