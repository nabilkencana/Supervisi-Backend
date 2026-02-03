import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { UpdateScheduleStatusDto } from './dto/update-schedule-status.dto';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) { }

  async create(createScheduleDto: CreateScheduleDto) {
    // Check if supervisor exists
    const supervisor = await this.prisma.supervisor.findUnique({
      where: { id: createScheduleDto.supervisorId },
    });

    if (!supervisor) {
      throw new NotFoundException('Supervisor not found');
    }

    // Check if teacher exists
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: createScheduleDto.teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Check if schedule already exists at this time
    const existingSchedule = await this.prisma.schedule.findFirst({
      where: {
        supervisorId: createScheduleDto.supervisorId,
        teacherId: createScheduleDto.teacherId,
        scheduledDate: new Date(createScheduleDto.scheduledDate),
      },
    });

    if (existingSchedule) {
      throw new ConflictException(
        'Schedule already exists for this supervisor, teacher, and time',
      );
    }

    return this.prisma.schedule.create({
      data: {
        ...createScheduleDto,
        scheduledDate: new Date(createScheduleDto.scheduledDate),
      },
      include: {
        supervisor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(
    skip: number = 0,
    take: number = 10,
    filters?: {
      supervisorId?: string;
      teacherId?: string;
      type?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const where: any = {};

    if (filters?.supervisorId) {
      where.supervisorId = filters.supervisorId;
    }

    if (filters?.teacherId) {
      where.teacherId = filters.teacherId;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.scheduledDate = {
        ...(filters.startDate && { gte: filters.startDate }),
        ...(filters.endDate && { lte: filters.endDate }),
      };
    }

    const [schedules, total] = await Promise.all([
      this.prisma.schedule.findMany({
        skip,
        take,
        where,
        include: {
          supervisor: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          teacher: {
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
        orderBy: { scheduledDate: 'asc' },
      }),
      this.prisma.schedule.count({ where }),
    ]);

    return {
      data: schedules,
      total,
      skip,
      take,
    };
  }

  async findOne(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        supervisor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    return schedule;
  }

  async getUpcomingSchedules(userId: string, userRole: string, days: number = 7) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    let where: any = {
      scheduledDate: {
        gte: startDate,
        lte: endDate,
      },
      status: 'SCHEDULED',
    };

    if (userRole === 'SUPERVISOR') {
      const supervisor = await this.prisma.supervisor.findFirst({
        where: { userId },
      });

      if (!supervisor) {
        return [];
      }

      where.supervisorId = supervisor.id;
    } else if (userRole === 'TEACHER') {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId },
      });

      if (!teacher) {
        return [];
      }

      where.teacherId = teacher.id;
    }

    return this.prisma.schedule.findMany({
      where,
      include: {
        supervisor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
      take: 20,
    });
  }

  async update(id: string, updateScheduleDto: UpdateScheduleDto) {
    const schedule = await this.findOne(id);

    // If date is being updated, check for conflicts
    if (
      updateScheduleDto.scheduledDate &&
      new Date(updateScheduleDto.scheduledDate).getTime() !==
      schedule.scheduledDate.getTime()
    ) {
      const existing = await this.prisma.schedule.findFirst({
        where: {
          supervisorId: schedule.supervisorId,
          teacherId: schedule.teacherId,
          scheduledDate: new Date(updateScheduleDto.scheduledDate),
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(
          'Schedule already exists for this supervisor, teacher, and time',
        );
      }
    }

    const data: any = { ...updateScheduleDto };
    if (data.scheduledDate) {
      data.scheduledDate = new Date(data.scheduledDate);
    }

    return this.prisma.schedule.update({
      where: { id },
      data,
      include: {
        supervisor: true,
        teacher: true,
      },
    });
  }

  async updateStatus(id: string, updateStatusDto: UpdateScheduleStatusDto) {
    await this.findOne(id); // Check if exists

    return this.prisma.schedule.update({
      where: { id },
      data: {
        status: updateStatusDto.status,
        ...(updateStatusDto.notes && { notes: updateStatusDto.notes }),
      },
      include: {
        supervisor: true,
        teacher: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check if exists

    return this.prisma.schedule.delete({
      where: { id },
    });
  }

  async getCalendarEvents(
    userId: string,
    userRole: string,
    startDate: Date,
    endDate: Date,
  ) {
    let where: any = {
      scheduledDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (userRole === 'SUPERVISOR') {
      const supervisor = await this.prisma.supervisor.findFirst({
        where: { userId },
      });

      if (!supervisor) {
        return [];
      }

      where.supervisorId = supervisor.id;
    } else if (userRole === 'TEACHER') {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId },
      });

      if (!teacher) {
        return [];
      }

      where.teacherId = teacher.id;
    }

    const schedules = await this.prisma.schedule.findMany({
      where,
      include: {
        supervisor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
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
      orderBy: { scheduledDate: 'asc' },
    });

    return schedules.map((schedule) => ({
      id: schedule.id,
      title: `${schedule.type} - ${schedule.teacher.user.name}`,
      start: schedule.scheduledDate,
      end: new Date(schedule.scheduledDate.getTime() + 60 * 60 * 1000), // 1 hour duration
      type: schedule.type,
      status: schedule.status,
      location: schedule.location,
      description: schedule.description,
      supervisor: schedule.supervisor.user.name,
      teacher: schedule.teacher.user.name,
    }));
  }
}