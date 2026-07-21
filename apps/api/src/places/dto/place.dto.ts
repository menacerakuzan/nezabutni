import { IsIn, IsLatitude, IsLongitude, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

const PLACE_TYPES = ["battle", "memorial", "burial", "monument", "museum_site", "frontline_segment"];

export class CreatePlaceDto {
  @IsIn(PLACE_TYPES)
  type!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsLongitude()
  lon!: number;

  @IsLatitude()
  lat!: number;
}

export class UpdatePlaceDto {
  @IsIn(PLACE_TYPES)
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsLongitude()
  @IsOptional()
  lon?: number;

  @IsLatitude()
  @IsOptional()
  lat?: number;
}
