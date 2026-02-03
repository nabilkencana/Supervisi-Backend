import { IsEmail, IsEnum, IsNotEmpty, MinLength, IsOptional, IsString } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class RegisterDto {
    @IsEmail({}, { message: 'Email tidak valid' })
    @IsNotEmpty({ message: 'Email harus diisi' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'Nama harus diisi' })
    name: string;

    @IsString()
    @IsNotEmpty({ message: 'Password harus diisi' })
    @MinLength(6, { message: 'Password minimal 6 karakter' })
    password: string;

    @IsEnum(Role, {
        message: 'Role harus salah satu dari: ADMIN, SUPERVISOR, TEACHER'
    })
    @IsNotEmpty({ message: 'Role harus diisi' })
    role: Role;

    @IsOptional()
    @IsString()
    phone?: string;
}