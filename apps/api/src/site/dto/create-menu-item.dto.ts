import { IsIn, IsString, MaxLength } from "class-validator";

const LOCATIONS = ["header", "footer_memorial", "footer_platform", "footer_join"] as const;

export class CreateMenuItemDto {
  @IsString()
  @MaxLength(120)
  label!: string;

  @IsString()
  @MaxLength(255)
  href!: string;

  @IsIn(LOCATIONS)
  location!: (typeof LOCATIONS)[number];
}
