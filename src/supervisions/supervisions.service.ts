import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupervisionDto } from './dto/create-supervision.dto';
import { UpdateSupervisionDto } from './dto/update-supervision.dto';

@Injectable()
export class SupervisionsService {
  constructor(private prisma: PrismaService) { }

  async create(createSupervisionDto: CreateSupervisionDto) {
    // Check if supervisor exists
    const supervisor = await this.prisma.supervisor.findUnique({
      where: { id: createSupervisionDto.supervisorId },
    });

    if (!supervisor) {
      throw new NotFoundException('Supervisor not found');
    }

    // Check if teacher exists
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: createSupervisionDto.teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Check if supervision already exists at this time
    const existingSupervision = await this.prisma.supervision.findFirst({
      where: {
        supervisorId: createSupervisionDto.supervisorId,
        teacherId: createSupervisionDto.teacherId,
        date: new Date(createSupervisionDto.date),
      },
    });

    if (existingSupervision) {
      throw new ConflictException(
        'Supervision already exists for this supervisor, teacher, and time',
      );
    }

    return this.prisma.supervision.create({
      data: {
        ...createSupervisionDto,
        date: new Date(createSupervisionDto.date),
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

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {
        ...(filters.startDate && { gte: filters.startDate }),
        ...(filters.endDate && { lte: filters.endDate }),
      };
    }

    const [supervisions, total] = await Promise.all([
      this.prisma.supervision.findMany({
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
          assessments: true,
        },
        orderBy: { date: 'desc' },
      }),
      this.prisma.supervision.count({ where }),
    ]);

    return {
      data: supervisions,
      total,
      skip,
      take,
    };
  }

  async findOne(id: string) {
    const supervision = await this.prisma.supervision.findUnique({
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
        assessments: true,
      },
    });

    if (!supervision) {
      throw new NotFoundException(`Supervision with ID ${id} not found`);
    }

    return supervision;
  }

  async update(id: string, updateSupervisionDto: UpdateSupervisionDto) {
    const supervision = await this.findOne(id);

    // If date is being updated, check for conflicts
    if (
      updateSupervisionDto.date &&
      new Date(updateSupervisionDto.date).getTime() !==
      supervision.date.getTime()
    ) {
      const existing = await this.prisma.supervision.findFirst({
        where: {
          supervisorId: supervision.supervisorId,
          teacherId: supervision.teacherId,
          date: new Date(updateSupervisionDto.date),
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(
          'Supervision already exists for this supervisor, teacher, and time',
        );
      }
    }

    const data: any = { ...updateSupervisionDto };
    if (data.date) {
      data.date = new Date(data.date);
    }

    return this.prisma.supervision.update({
      where: { id },
      data,
      include: {
        supervisor: true,
        teacher: true,
      },
    });
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id); // Check if exists

    if (!['PENDING', 'COMPLETED', 'RESCHEDULED', 'CANCELLED'].includes(status)) {
      throw new ConflictException('Invalid status');
    }

    return this.prisma.supervision.update({
      where: { id },
      data: { status: status as any },
      include: {
        supervisor: true,
        teacher: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check if exists

    return this.prisma.supervision.delete({
      where: { id },
    });
  }

  async getSupervisionStats(supervisorId?: string, teacherId?: string) {
    const where: any = {};

    if (supervisorId) {
      where.supervisorId = supervisorId;
    }

    if (teacherId) {
      where.teacherId = teacherId;
    }

    const supervisions = await this.prisma.supervision.findMany({
      where,
      select: {
        status: true,
        type: true,
        date: true,
      },
    });

    const stats = {
      total: supervisions.length,
      byStatus: {
        PENDING: 0,
        COMPLETED: 0,
        RESCHEDULED: 0,
        CANCELLED: 0,
      },
      byType: {
        OFFLINE: 0,
        ONLINE: 0,
        HYBRID: 0,
      },
      byMonth: {},
    };

    supervisions.forEach((supervision) => {
      stats.byStatus[supervision.status]++;
      stats.byType[supervision.type]++;

      const month = supervision.date.toISOString().substring(0, 7); // YYYY-MM
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
    });

    return stats;
  }
}