import { ArrayNotEmpty, ArrayUnique, IsArray, IsUUID } from "class-validator";

export class ReorderBlocksDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  ids!: string[];
}
