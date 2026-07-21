import { IsBoolean, IsObject, IsOptional, IsString } from "class-validator";

export class ConsentDto {
  @IsBoolean()
  publishData!: boolean;

  @IsBoolean()
  @IsOptional()
  publishMedia?: boolean;

  @IsBoolean()
  processPii!: boolean;
}

export class CreateSubmissionDto {
  @IsString()
  @IsOptional()
  defenderPid?: string;

  @IsObject()
  payload!: Record<string, unknown>;

  @IsOptional()
  attachedMediaIds?: string[];

  @IsObject()
  consent!: ConsentDto;
}
