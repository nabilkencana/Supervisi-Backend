import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    skip: number = 0,
    take: number = 10,
    search?: string,
    role?: Role,
    isActive?: boolean,
  ) {
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          profileImage: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          supervisor: {
            select: {
              id: true,
              nip: true,
              specialization: true,
            },
          },
          teacher: {
            select: {
              id: true,
              nip: true,
              subject: true,
              classroom: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      skip,
      take,
    };
  }

  async search(query: string, role?: Role) {
    const where: any = {
      OR: [
        { email: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ],
      isActive: true,
    };

    if (role) {
      where.role = role;
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
      },
      take: 20,
      orderBy: { name: 'asc' },
    });
  }

  async findByRole(role: Role, skip: number = 0, take: number = 10) {
    const where = { role, isActive: true };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          profileImage: true,
          isActive: true,
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      skip,
      take,
    };
  }

  async findActive(skip: number = 0, take: number = 10) {
    const where = { isActive: true };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          profileImage: true,
          isActive: true,
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      skip,
      take,
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        profileImage: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        supervisor: {
          select: {
            id: true,
            nip: true,
            specialization: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        teacher: {
          select: {
            id: true,
            nip: true,
            subject: true,
            classroom: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        password: hashedPassword,
        role: createUserDto.role,
        phone: createUserDto.phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        profileImage: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    // Check if email is being updated and if it already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Hash password if being updated
    let hashedPassword;
    if (updateUserDto.password) {
      hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
    }

    const data: any = { ...updateUserDto };
    if (hashedPassword) {
      data.password = hashedPassword;
    } else {
      delete data.password;
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        profileImage: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async toggleActive(id: string, isActive: boolean) {
    await this.findOne(id); // Check if user exists

    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async changePassword(
    id: string,
    changePasswordDto: { oldPassword: string; newPassword: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { password: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check if user exists

    // Soft delete - set isActive to false
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async checkEmailExists(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return { exists: !!user };
  }

  async getStats() {
    const [total, byRole, active] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);

    const inactive = total - active;

    const stats = {
      total,
      byRole: {
        ADMIN: 0,
        SUPERVISOR: 0,
        TEACHER: 0,
      },
      active,
      inactive,
    };

    byRole.forEach((item) => {
      stats.byRole[item.role] = item._count;
    });

    return stats;
  }

  async bulkCreate(users: CreateUserDto[]) {
    // Validate all users first
    for (const user of users) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existingUser) {
        throw new ConflictException(`Email ${user.email} already exists`);
      }
    }

    // Hash passwords
    const usersWithHashedPasswords = await Promise.all(
      users.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10),
      })),
    );

    // Create users
    const createdUsers = await this.prisma.$transaction(
      usersWithHashedPasswords.map((user) =>
        this.prisma.user.create({
          data: user,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
        }),
      ),
    );

    return createdUsers;
  }
}
