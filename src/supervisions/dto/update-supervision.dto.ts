import { PartialType } from '@nestjs/mapped-types';
import { CreateSupervisionDto } from './create-supervision.dto';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { SupervisionStatus, SupervisionType } from '@prisma/client';

export class UpdateSupervisionDto extends PartialType(CreateSupervisionDto) {
  @IsString()
  @IsNotEmpty()
  supervisorId: string;

  @IsString()
  @IsNotEmpty()
  teacherId: string;

  @IsEnum(SupervisionType)
  @IsNotEmpty()
  type: SupervisionType;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(SupervisionStatus)
  @IsOptional()
  status?: SupervisionStatus;
}
