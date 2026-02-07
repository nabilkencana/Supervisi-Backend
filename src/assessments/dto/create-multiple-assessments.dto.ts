import { Type } from 'class-transformer';
import { ValidateNested, IsArray } from 'class-validator';
import { CreateAssessmentDto } from './create-assesment.dto';

export class CreateMultipleAssessmentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAssessmentDto)
  assessments: CreateAssessmentDto[];
}
