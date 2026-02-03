import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupervisorDto } from './dto/create-supervisor.dto';
import { UpdateSupervisorDto } from './dto/update-supervisor.dto';
import { AssignTeacherDto } from './dto/assign-teacher.dto';

@Injectable()
export class SupervisorsService {
  constructor(private prisma: PrismaService) { }

  async create(createSupervisorDto: CreateSupervisorDto) {
    // Check if user exists and has SUPERVISOR role
    const user = await this.prisma.user.findUnique({
      where: { id: createSupervisorDto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'SUPERVISOR') {
      throw new ConflictException('User must have SUPERVISOR role');
    }

    // Check if NIP is unique
    const existingSupervisor = await this.prisma.supervisor.findUnique({
      where: { nip: createSupervisorDto.nip },
    });

    if (existingSupervisor) {
      throw new ConflictException('NIP already exists');
    }

    return this.prisma.supervisor.create({
      data: createSupervisorDto,
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

  async findAll(skip: number = 0, take: number = 10) {
    const [supervisors, total] = await Promise.all([
      this.prisma.supervisor.findMany({
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
          assignedTeachers: {
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
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supervisor.count(),
    ]);

    return {
      data: supervisors,
      total,
      skip,
      take,
    };
  }

  async findOne(id: string) {
    const supervisor = await this.prisma.supervisor.findUnique({
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
        assignedTeachers: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        supervisions: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        schedules: true,
        reports: true,
      },
    });

    if (!supervisor) {
      throw new NotFoundException(`Supervisor with ID ${id} not found`);
    }

    return supervisor;
  }

  async update(id: string, updateSupervisorDto: UpdateSupervisorDto) {
    await this.findOne(id); // Check if exists

    if (updateSupervisorDto.nip) {
      const existing = await this.prisma.supervisor.findFirst({
        where: {
          nip: updateSupervisorDto.nip,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('NIP already exists');
      }
    }

    return this.prisma.supervisor.update({
      where: { id },
      data: updateSupervisorDto,
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

    return this.prisma.supervisor.delete({
      where: { id },
    });
  }

  async assignTeachers(supervisorId: string, assignTeacherDto: AssignTeacherDto) {
    const supervisor = await this.findOne(supervisorId);

    // Check if all teachers exist
    const teachers = await this.prisma.teacher.findMany({
      where: {
        id: { in: assignTeacherDto.teacherIds }
      }
    });

    if (teachers.length !== assignTeacherDto.teacherIds.length) {
      throw new NotFoundException('Some teachers not found');
    }

    // Remove existing assignments
    await this.prisma.supervisor.update({
      where: { id: supervisorId },
      data: {
        assignedTeachers: {
          set: []
        }
      }
    });

    // Assign new teachers
    return this.prisma.supervisor.update({
      where: { id: supervisorId },
      data: {
        assignedTeachers: {
          connect: assignTeacherDto.teacherIds.map(id => ({ id }))
        }
      },
      include: {
        assignedTeachers: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        }
      }
    });
  }

  async getAssignedTeachers(supervisorId: string) {
    const supervisor = await this.prisma.supervisor.findUnique({
      where: { id: supervisorId },
      include: {
        assignedTeachers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              }
            }
          }
        }
      }
    });

    if (!supervisor) {
      throw new NotFoundException(`Supervisor with ID ${supervisorId} not found`);
    }

    return supervisor.assignedTeachers;
  }
}