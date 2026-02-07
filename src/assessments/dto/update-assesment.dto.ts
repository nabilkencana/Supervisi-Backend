import { PartialType } from '@nestjs/mapped-types';
import { CreateAssessmentDto } from './create-assesment.dto';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateAssessmentDto extends PartialType(CreateAssessmentDto) {
  @IsString()
  @IsNotEmpty()
  supervisionId: string;

  @IsString()
  @IsNotEmpty()
  teacherId: string;

  @IsString()
  @IsNotEmpty()
  aspectName: string;

  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @IsString()
  @IsOptional()
  feedback?: string;
}
