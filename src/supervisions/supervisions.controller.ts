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
import { SupervisionsService } from './supervisions.service';
import { CreateSupervisionDto } from './dto/create-supervision.dto';
import { UpdateSupervisionDto } from './dto/update-supervision.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('supervisions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupervisionsController {
  constructor(private readonly supervisionsService: SupervisionsService) { }

  @Post()
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  create(@Body() createSupervisionDto: CreateSupervisionDto) {
    return this.supervisionsService.create(createSupervisionDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.TEACHER)
  findAll(
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
    @Query('supervisorId') supervisorId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      ...(supervisorId && { supervisorId }),
      ...(teacherId && { teacherId }),
      ...(status && { status }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
    };

    return this.supervisionsService.findAll(+skip, +take, filters);
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  getStats(
    @Query('supervisorId') supervisorId?: string,
    @Query('teacherId') teacherId?: string,
  ) {
    return this.supervisionsService.getSupervisionStats(supervisorId, teacherId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.TEACHER)
  findOne(@Param('id') id: string) {
    return this.supervisionsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateSupervisionDto: UpdateSupervisionDto,
  ) {
    return this.supervisionsService.update(id, updateSupervisionDto);
  }

  @Put(':id/status/:status')
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Param('status') status: string,
  ) {
    return this.supervisionsService.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.supervisionsService.remove(id);
  }
}