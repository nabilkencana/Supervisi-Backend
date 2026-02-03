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
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @Roles(Role.ADMIN)
  findAll(
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
    @Query('q') search?: string,
    @Query('role') role?: Role,
    @Query('isActive') isActive?: string,
  ) {
    return this.usersService.findAll(
      +skip,
      +take,
      search,
      role,
      isActive === 'true',
    );
  }

  @Get('search')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  search(
    @Query('q') query: string,
    @Query('role') role?: Role,
  ) {
    return this.usersService.search(query, role);
  }

  @Get('role/:role')
  @Roles(Role.ADMIN)
  findByRole(
    @Param('role') role: Role,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
  ) {
    return this.usersService.findByRole(role, +skip, +take);
  }

  @Get('active')
  @Roles(Role.ADMIN)
  findActive(
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
  ) {
    return this.usersService.findActive(+skip, +take);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.TEACHER)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get('profile')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.TEACHER)
  getProfile(@Req() req) {
    return this.usersService.findOne(req.user.userId);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch('profile')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.TEACHER)
  updateProfile(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.userId, updateUserDto);
  }

  @Patch(':id/toggle-active')
  @Roles(Role.ADMIN)
  toggleActive(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.usersService.toggleActive(id, isActive);
  }

  @Post(':id/change-password')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.TEACHER)
  changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: { oldPassword: string; newPassword: string },
  ) {
    return this.usersService.changePassword(id, changePasswordDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Get('check-email')
  @Roles(Role.ADMIN)
  checkEmailExists(@Query('email') email: string) {
    return this.usersService.checkEmailExists(email);
  }

  @Get('stats')
  @Roles(Role.ADMIN)
  getStats() {
    return this.usersService.getStats();
  }

  @Post('bulk')
  @Roles(Role.ADMIN)
  bulkCreate(@Body() body: { users: CreateUserDto[] }) {
    return this.usersService.bulkCreate(body.users);
  }
}