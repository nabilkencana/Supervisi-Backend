import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ScheduleType } from '@prisma/client';

export class CreateScheduleDto {
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
