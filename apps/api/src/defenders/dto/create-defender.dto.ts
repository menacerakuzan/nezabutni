import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateDefenderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  fullName!: string;

  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @IsDateString()
  @IsOptional()
  deathDate?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  callsign?: string;

  @IsUUID()
  @IsOptional()
  portraitMediaId?: string;
}
