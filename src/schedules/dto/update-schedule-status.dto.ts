import { IsEnum, IsNotEmpty } from 'class-validator';
import { ScheduleStatus } from '@prisma/client';

export class UpdateScheduleStatusDto {
    @IsEnum(ScheduleStatus)
    @IsNotEmpty()
    status: ScheduleStatus;

    @IsNotEmpty()
    notes?: string;
}