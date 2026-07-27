import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

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
}
