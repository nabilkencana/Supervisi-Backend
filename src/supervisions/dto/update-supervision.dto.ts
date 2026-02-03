import { PartialType } from '@nestjs/mapped-types';
import { CreateSupervisionDto } from './create-supervision.dto';

export class UpdateSupervisionDto extends PartialType(CreateSupervisionDto) { }