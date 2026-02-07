import { PartialType } from '@nestjs/mapped-types';
import { CreateSupervisorDto } from './create-supervisor.dto';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateSupervisorDto extends PartialType(CreateSupervisorDto) {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  nip: string;

  @IsString()
  @IsOptional()
  specialization?: string;
}
