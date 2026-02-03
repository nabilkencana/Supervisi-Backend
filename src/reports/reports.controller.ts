import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Put,
  Req,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { GenerateReportDto } from './dto/generate-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Post()
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  create(@Body() createReportDto: CreateReportDto) {
    return this.reportsService.create(createReportDto);
  }

  @Post('generate')
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  generateReport(@Body() generateReportDto: GenerateReportDto) {
    // Langsung gunakan supervisorId dari body
    return this.reportsService.generateReport(generateReportDto, generateReportDto.supervisorId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.TEACHER)
  findAll(
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
    @Query('supervisorId') supervisorId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('period') period?: string,
    @Query('status') status?: string,
  ) {
    const filters = {
      ...(supervisorId && { supervisorId }),
      ...(teacherId && { teacherId }),
      ...(period && { period }),
      ...(status && { status }),
    };

    return this.reportsService.findAll(+skip, +take, filters);
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  getReportStats(@Query('supervisorId') supervisorId?: string) {
    return this.reportsService.getReportStats(supervisorId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.TEACHER)
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Get('teacher/:teacherId')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.TEACHER)
  findByTeacher(@Param('teacherId') teacherId: string) {
    return this.reportsService.findByTeacher(teacherId);
  }

  @Patch(':id')
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
  ) {
    return this.reportsService.update(id, updateReportDto);
  }

  @Put(':id/status/:status')
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Param('status') status: string,
  ) {
    return this.reportsService.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.reportsService.remove(id);
  }
}