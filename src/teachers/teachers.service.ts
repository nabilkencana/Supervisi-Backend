import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) { }

  async create(createTeacherDto: CreateTeacherDto) {
    // Check if user exists and has TEACHER role
    const user = await this.prisma.user.findUnique({
      where: { id: createTeacherDto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'TEACHER') {
      throw new ConflictException('User must have TEACHER role');
    }

    // Check if NIP is unique
    const existingTeacher = await this.prisma.teacher.findUnique({
      where: { nip: createTeacherDto.nip },
    });

    if (existingTeacher) {
      throw new ConflictException('NIP already exists');
    }

    return this.prisma.teacher.create({
      data: createTeacherDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            isActive: true,
          },
        },
      },
    });
  }

  async findByUserId(userId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            isActive: true,
          },
        },
        assignedSupervisors: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found for this user');
    }

    return teacher;
  }

  async findAll(skip: number = 0, take: number = 10) {
    const [teachers, total] = await Promise.all([
      this.prisma.teacher.findMany({
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              phone: true,
              isActive: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.teacher.count(),
    ]);

    return {
      data: teachers,
      total,
      skip,
      take,
    };
  }

  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            isActive: true,
          },
        },
        assignedSupervisors: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        supervisions: true,
        assessments: true,
        schedules: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    return teacher;
  }

  async update(id: string, updateTeacherDto: UpdateTeacherDto) {
    await this.findOne(id); // Check if exists

    if (updateTeacherDto.nip) {
      const existing = await this.prisma.teacher.findFirst({
        where: {
          nip: updateTeacherDto.nip,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('NIP already exists');
      }
    }

    return this.prisma.teacher.update({
      where: { id },
      data: updateTeacherDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            isActive: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check if exists

    return this.prisma.teacher.delete({
      where: { id },
    });
  }
}