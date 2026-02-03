import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTeacherDto {
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    nip: string;

    @IsString()
    @IsNotEmpty()
    subject: string;

    @IsString()
    @IsOptional()
    classroom?: string;
}