import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AssignTeacherDto {
    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty()
    teacherIds: string[];
}