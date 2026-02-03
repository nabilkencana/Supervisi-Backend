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
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { UpdateScheduleStatusDto } from './dto/update-schedule-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) { }

  @Post()
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.schedulesService.create(createScheduleDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.TEACHER)
  findAll(
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
    @Query('supervisorId') supervisorId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      ...(supervisorId && { supervisorId }),
      ...(teacherId && { teacherId }),
      ...(type && { type }),
      ...(status && { status }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
    };

    return this.schedulesService.findAll(+skip, +take, filters);
  }

  @Get('upcoming')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.TEACHER)
  getUpcomingSchedules(
    @Req() req,
    @Query('days') days: string = '7',
  ) {
    return this.schedulesService.getUpcomingSchedules(
      req.user.userId,
      req.user.role,
      +days,
    );
  }

  @Get('calendar')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.TEACHER)
  getCalendarEvents(
    @Req() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.schedulesService.getCalendarEvents(
      req.user.userId,
      req.user.role,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.TEACHER)
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    return this.schedulesService.update(id, updateScheduleDto);
  }

  @Put(':id/status')
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateScheduleStatusDto,
  ) {
    return this.schedulesService.updateStatus(id, updateStatusDto);
  }

  @Delete(':id')
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.schedulesService.remove(id);
  }
}