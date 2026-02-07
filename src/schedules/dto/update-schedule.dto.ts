import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduleDto } from './create-schedule.dto';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ScheduleType } from '@prisma/client';

export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {
  @IsString()
  @IsNotEmpty()
  supervisorId: string;

  @IsString()
  @IsNotEmpty()
  teacherId: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledDate: string;

  @IsEnum(ScheduleType)
  @IsNotEmpty()
  type: ScheduleType;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
