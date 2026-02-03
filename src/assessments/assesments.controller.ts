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
} from '@nestjs/common';
import { AssessmentsService } from './assesments.service';
import { CreateAssessmentDto } from './dto/create-assesment.dto';
import { UpdateAssessmentDto } from './dto/update-assesment.dto';
import { CreateMultipleAssessmentsDto } from './dto/create-multiple-assessments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('assessments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) { }

  @Post()
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  create(@Body() createAssessmentDto: CreateAssessmentDto) {
    return this.assessmentsService.create(createAssessmentDto);
  }

  @Post('multiple')
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  createMultiple(@Body() createMultipleAssessmentsDto: CreateMultipleAssessmentsDto) {
    return this.assessmentsService.createMultiple(createMultipleAssessmentsDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.TEACHER)
  findAll(
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
    @Query('teacherId') teacherId?: string,
    @Query('supervisorId') supervisorId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      ...(teacherId && { teacherId }),
      ...(supervisorId && { supervisorId }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
    };

    return this.assessmentsService.findAll(+skip, +take, filters);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.TEACHER)
  findOne(@Param('id') id: string) {
    return this.assessmentsService.findOne(id);
  }

  @Get('supervision/:supervisionId')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.TEACHER)
  findBySupervision(@Param('supervisionId') supervisionId: string) {
    return this.assessmentsService.findBySupervision(supervisionId);
  }

  @Get('teacher/:teacherId/summary')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.TEACHER)
  getTeacherSummary(@Param('teacherId') teacherId: string) {
    return this.assessmentsService.getTeacherSummary(teacherId);
  }

  @Patch(':id')
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateAssessmentDto: UpdateAssessmentDto,
  ) {
    return this.assessmentsService.update(id, updateAssessmentDto);
  }

  @Delete(':id')
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.assessmentsService.remove(id);
  }
}