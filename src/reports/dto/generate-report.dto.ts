import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateReportDto {
  @IsString()
  @IsNotEmpty()
  supervisorId: string;

  @IsString()
  @IsNotEmpty()
  teacherId: string;

  @IsString()
  @IsNotEmpty()
  period: string; // Format: "2024-01"

  @IsString()
  @IsNotEmpty()
  title: string;
}
