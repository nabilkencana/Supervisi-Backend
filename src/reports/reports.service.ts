import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { GenerateReportDto } from './dto/generate-report.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) { }

  async create(createReportDto: CreateReportDto) {
    // Check if supervisor exists
    const supervisor = await this.prisma.supervisor.findUnique({
      where: { id: createReportDto.supervisorId },
    });

    if (!supervisor) {
      throw new NotFoundException('Supervisor not found');
    }

    // Check if teacher exists
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: createReportDto.teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Check if report for this period already exists
    const existingReport = await this.prisma.report.findFirst({
      where: {
        supervisorId: createReportDto.supervisorId,
        teacherId: createReportDto.teacherId,
        period: createReportDto.period,
      },
    });

    if (existingReport) {
      throw new ConflictException(
        `Report already exists for teacher ${teacher.userId} in period ${createReportDto.period}`,
      );
    }

    return this.prisma.report.create({
      data: createReportDto,
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
      },
    });
  }

  async generateReport(generateReportDto: GenerateReportDto, supervisorId: string) {
    const supervisor = await this.prisma.supervisor.findUnique({
      where: { id: supervisorId },
    });

    if (!supervisor) {
      throw new NotFoundException('Supervisor not found');
    }

    const teacher = await this.prisma.teacher.findUnique({
      where: { id: generateReportDto.teacherId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Check if report already exists
    const existingReport = await this.prisma.report.findFirst({
      where: {
        supervisorId,
        teacherId: generateReportDto.teacherId,
        period: generateReportDto.period,
      },
    });

    if (existingReport) {
      throw new ConflictException(
        `Report already exists for this teacher in period ${generateReportDto.period}`,
      );
    }

    // Get assessments for this period
    const [year, month] = generateReportDto.period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const assessments = await this.prisma.assessment.findMany({
      where: {
        teacherId: generateReportDto.teacherId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
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
    });

    // Calculate average score
    const averageScore =
      assessments.length > 0
        ? assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length
        : 0;

    // Generate report content
    let content = `# Laporan Supervisi Guru\n\n`;
    content += `**Periode:** ${generateReportDto.period}\n`;
    content += `**Guru:** ${teacher.user.name}\n`;
    content += `**Mata Pelajaran:** ${teacher.subject}\n`;
    content += `**Kelas:** ${teacher.classroom || 'Tidak ditentukan'}\n\n`;

    content += `## Ringkasan Penilaian\n`;
    content += `Rata-rata skor: **${averageScore.toFixed(2)}/5.00**\n`;
    content += `Jumlah penilaian: **${assessments.length}**\n\n`;

    if (assessments.length > 0) {
      content += `## Detail Penilaian\n\n`;
      assessments.forEach((assessment, index) => {
        content += `### Aspek: ${assessment.aspectName}\n`;
        content += `- Skor: ${assessment.score}/5\n`;
        content += `- Supervisor: ${assessment.supervision.supervisor.user.name}\n`;
        if (assessment.feedback) {
          content += `- Feedback: ${assessment.feedback}\n`;
        }
        content += `- Tanggal: ${assessment.createdAt.toLocaleDateString('id-ID')}\n\n`;
      });

      // Group by aspect for analysis
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

      content += `## Analisis Aspek Penilaian\n\n`;
      Object.entries(aspectSummary).forEach(([aspect, data]: [string, any]) => {
        content += `**${aspect}**: Rata-rata ${data.average.toFixed(2)}/5.00\n`;
      });
    } else {
      content += `## Tidak ada data penilaian untuk periode ini.\n`;
    }

    // Generate recommendations based on scores
    let recommendations = '';
    if (averageScore < 3) {
      recommendations = `Rekomendasi: Guru memerlukan bimbingan intensif. Disarankan untuk:\n1. Pelatihan tambahan\n2. Observasi kelas lebih sering\n3. Diskusi rutin dengan supervisor`;
    } else if (averageScore < 4) {
      recommendations = `Rekomendasi: Guru menunjukkan perkembangan baik. Disarankan untuk:\n1. Penguatan pada aspek tertentu\n2. Sharing session dengan guru lain\n3. Implementasi metode pembelajaran inovatif`;
    } else {
      recommendations = `Rekomendasi: Guru menunjukkan kinerja sangat baik. Dapat dipertimbangkan untuk:\n1. Menjadi mentor untuk guru lain\n2. Mengembangkan bahan ajar\n3. Presentasi best practice`;
    }

    // Create the report
    const report = await this.prisma.report.create({
      data: {
        supervisorId,
        teacherId: generateReportDto.teacherId,
        title: generateReportDto.title,
        content,
        period: generateReportDto.period,
        averageScore: parseFloat(averageScore.toFixed(2)),
        recommendations,
        status: 'DRAFT',
      },
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
    });

    return {
      message: 'Report generated successfully',
      data: report,
    };
  }

  async findAll(
    skip: number = 0,
    take: number = 10,
    filters?: {
      supervisorId?: string;
      teacherId?: string;
      period?: string;
      status?: string;
    },
  ) {
    const where: any = {};

    if (filters?.supervisorId) {
      where.supervisorId = filters.supervisorId;
    }

    if (filters?.teacherId) {
      where.teacherId = filters.teacherId;
    }

    if (filters?.period) {
      where.period = filters.period;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
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
        },
        orderBy: { generatedAt: 'desc' },
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      data: reports,
      total,
      skip,
      take,
    };
  }

  async findOne(id: string) {
    const report = await this.prisma.report.findUnique({
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
      },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return report;
  }

  async findByTeacher(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return this.prisma.report.findMany({
      where: { teacherId },
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
      orderBy: { period: 'desc' },
    });
  }

  async update(id: string, updateReportDto: UpdateReportDto) {
    const report = await this.findOne(id);

    // If period is being updated, check for uniqueness
    if (updateReportDto.period && updateReportDto.period !== report.period) {
      const existing = await this.prisma.report.findFirst({
        where: {
          supervisorId: report.supervisorId,
          teacherId: report.teacherId,
          period: updateReportDto.period,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Report already exists for this teacher in period ${updateReportDto.period}`,
        );
      }
    }

    return this.prisma.report.update({
      where: { id },
      data: updateReportDto,
      include: {
        supervisor: true,
      },
    });
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id); // Check if exists

    if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    return this.prisma.report.update({
      where: { id },
      data: { status: status as any },
      include: {
        supervisor: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check if exists

    return this.prisma.report.delete({
      where: { id },
    });
  }

  async getReportStats(supervisorId?: string) {
    const where: any = {};

    if (supervisorId) {
      where.supervisorId = supervisorId;
    }

    const reports = await this.prisma.report.findMany({
      where,
      select: {
        status: true,
        period: true,
        averageScore: true,
      },
    });

    const stats = {
      total: reports.length,
      byStatus: {
        DRAFT: 0,
        PUBLISHED: 0,
        ARCHIVED: 0,
      },
      byPeriod: {},
      averageScore: 0,
    };

    if (reports.length > 0) {
      let totalScore = 0;
      let scoresCount = 0;

      reports.forEach((report) => {
        stats.byStatus[report.status]++;

        if (report.period) {
          stats.byPeriod[report.period] = (stats.byPeriod[report.period] || 0) + 1;
        }

        if (report.averageScore) {
          totalScore += report.averageScore;
          scoresCount++;
        }
      });

      if (scoresCount > 0) {
        stats.averageScore = parseFloat((totalScore / scoresCount).toFixed(2));
      }
    }

    return stats;
  }
}