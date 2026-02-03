import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSupervisorDto {
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