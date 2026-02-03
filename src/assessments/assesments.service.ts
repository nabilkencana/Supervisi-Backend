import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssessmentDto } from './dto/create-assesment.dto';
import { UpdateAssessmentDto } from './dto/update-assesment.dto';
import { CreateMultipleAssessmentsDto } from './dto/create-multiple-assessments.dto';

@Injectable()
export class AssessmentsService {
  constructor(private prisma: PrismaService) { }

  async create(createAssessmentDto: CreateAssessmentDto) {
    // Check if supervision exists
    const supervision = await this.prisma.supervision.findUnique({
      where: { id: createAssessmentDto.supervisionId },
    });

    if (!supervision) {
      throw new NotFoundException('Supervision not found');
    }

    // Check if teacher exists
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: createAssessmentDto.teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Check if assessment for this aspect already exists
    const existingAssessment = await this.prisma.assessment.findFirst({
      where: {
        supervisionId: createAssessmentDto.supervisionId,
        aspectName: createAssessmentDto.aspectName,
      },
    });

    if (existingAssessment) {
      throw new ConflictException(
        `Assessment for aspect "${createAssessmentDto.aspectName}" already exists for this supervision`,
      );
    }

    return this.prisma.assessment.create({
      data: createAssessmentDto,
      include: {
        supervision: {
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
    });
  }

  async createMultiple(createMultipleAssessmentsDto: CreateMultipleAssessmentsDto) {
    const results: any[] = [];

    for (const assessmentDto of createMultipleAssessmentsDto.assessments) {
      try {
        const assessment = await this.create(assessmentDto);
        results.push(assessment);
      } catch (error) {
        results.push({ error: error.message, data: assessmentDto });
      }
    }

    return results;
  }

  async findAll(
    skip: number = 0,
    take: number = 10,
    filters?: {
      teacherId?: string;
      supervisorId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const where: any = {};

    if (filters?.teacherId) {
      where.teacherId = filters.teacherId;
    }

    if (filters?.supervisorId) {
      where.supervision = {
        supervisorId: filters.supervisorId,
      };
    }

    if (filters?.startDate || filters?.endDate) {
      where.supervision = {
        ...where.supervision,
        date: {
          ...(filters.startDate && { gte: filters.startDate }),
          ...(filters.endDate && { lte: filters.endDate }),
        },
      };
    }

    const [assessments, total] = await Promise.all([
      this.prisma.assessment.findMany({
        skip,
        take,
        where,
        include: {
          supervision: {
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
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.assessment.count({ where }),
    ]);

    return {
      data: assessments,
      total,
      skip,
      take,
    };
  }

  async findOne(id: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        supervision: {
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
                  },
                },
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

    if (!assessment) {
      throw new NotFoundException(`Assessment with ID ${id} not found`);
    }

    return assessment;
  }

  async findBySupervision(supervisionId: string) {
    const supervision = await this.prisma.supervision.findUnique({
      where: { id: supervisionId },
    });

    if (!supervision) {
      throw new NotFoundException('Supervision not found');
    }

    return this.prisma.assessment.findMany({
      where: { supervisionId },
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
      orderBy: { aspectName: 'asc' },
    });
  }

  async getTeacherSummary(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const assessments = await this.prisma.assessment.findMany({
      where: { teacherId },
      include: {
        supervision: {
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (assessments.length === 0) {
      return {
        teacher,
        averageScore: 0,
        totalAssessments: 0,
        assessments: [],
      };
    }

    const totalScore = assessments.reduce((sum, a) => sum + a.score, 0);
    const averageScore = totalScore / assessments.length;

    // Group by aspect
    const aspectSummary = assessments.reduce((acc, assessment) => {
      const { aspectName, score } = assessment;
      if (!acc[aspectName]) {
        acc[aspectName] = {
          scores: [],
          average: 0,
        };
      }
      acc[aspectName].scores.push(score);
      acc[aspectName].average =
        acc[aspectName].scores.reduce((s, sc) => s + sc, 0) /
        acc[aspectName].scores.length;
      return acc;
    }, {});

    return {
      teacher,
      averageScore: parseFloat(averageScore.toFixed(2)),
      totalAssessments: assessments.length,
      assessments: assessments.slice(0, 10), // Last 10 assessments
      aspectSummary,
    };
  }

  async update(id: string, updateAssessmentDto: UpdateAssessmentDto) {
    const assessment = await this.findOne(id);

    // If aspectName is being updated, check for uniqueness
    if (updateAssessmentDto.aspectName && updateAssessmentDto.aspectName !== assessment.aspectName) {
      const existing = await this.prisma.assessment.findFirst({
        where: {
          supervisionId: assessment.supervisionId,
          aspectName: updateAssessmentDto.aspectName,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Assessment for aspect "${updateAssessmentDto.aspectName}" already exists for this supervision`,
        );
      }
    }

    return this.prisma.assessment.update({
      where: { id },
      data: updateAssessmentDto,
      include: {
        supervision: true,
        teacher: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check if exists

    return this.prisma.assessment.delete({
      where: { id },
    });
  }

  async removeBySupervision(supervisionId: string) {
    return this.prisma.assessment.deleteMany({
      where: { supervisionId },
    });
  }
}