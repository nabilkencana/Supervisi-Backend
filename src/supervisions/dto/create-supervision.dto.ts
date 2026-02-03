import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SupervisionType, SupervisionStatus } from '@prisma/client';

export class CreateSupervisionDto {
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