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
} from '@nestjs/common';
import { SupervisorsService } from './supervisors.service';
import { CreateSupervisorDto } from './dto/create-supervisor.dto';
import { UpdateSupervisorDto } from './dto/update-supervisor.dto';
import { AssignTeacherDto } from './dto/assign-teacher.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('supervisors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupervisorsController {
  constructor(private readonly supervisorsService: SupervisorsService) { }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createSupervisorDto: CreateSupervisorDto) {
    return this.supervisorsService.create(createSupervisorDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.TEACHER)
  findAll(
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
  ) {
    return this.supervisorsService.findAll(+skip, +take);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.TEACHER)
  findOne(@Param('id') id: string) {
    return this.supervisorsService.findOne(id);
  }

  @Get(':id/teachers')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  getAssignedTeachers(@Param('id') id: string) {
    return this.supervisorsService.getAssignedTeachers(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateSupervisorDto: UpdateSupervisorDto,
  ) {
    return this.supervisorsService.update(id, updateSupervisorDto);
  }

  @Put(':id/assign-teachers')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  assignTeachers(
    @Param('id') id: string,
    @Body() assignTeacherDto: AssignTeacherDto,
  ) {
    return this.supervisorsService.assignTeachers(id, assignTeacherDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.supervisorsService.remove(id);
  }
}
