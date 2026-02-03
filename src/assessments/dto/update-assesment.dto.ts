import { PartialType } from '@nestjs/mapped-types';
import { CreateAssessmentDto } from './create-assesment.dto';

export class UpdateAssessmentDto extends PartialType(CreateAssessmentDto) { }