import { PartialType } from '@nestjs/mapped-types';
import { CreateReportDto } from './create-report.dto';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ReportStatus } from '@prisma/client';

export class UpdateReportDto extends PartialType(CreateReportDto) {
  @IsString()
  @IsNotEmpty()
  supervisorId: string;

  @IsString()
  @IsNotEmpty()
  teacherId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  period: string; // Format: "2024-01" for January 2024

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  averageScore?: number;

  @IsString()
  @IsOptional()
  recommendations?: string;

  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;
}
