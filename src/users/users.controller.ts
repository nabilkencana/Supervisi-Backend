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
  ConsoleLogger,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  private readonly logger = new ConsoleLogger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService, // Inject PrismaService untuk debug
  ) {}

  @Get()
  @Roles(Role.ADMIN)
  async findAll(
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
    @Query('q') search?: string,
    @Query('role') role?: Role,
    @Query('isActive') isActive?: string,
  ) {
    this.logger.debug('=== 🔍 GET /users called ===');
    this.logger.debug('📋 Query Parameters:', {
      skip,
      take,
      search: search || 'not provided',
      role: role || 'not provided',
      isActive: isActive || 'not provided',
    });

    // Convert isActive string to boolean or undefined
    const isActiveBoolean =
      isActive !== undefined ? isActive === 'true' : undefined;

    this.logger.debug('🔄 Converted isActive:', isActiveBoolean);

    try {
      // Debug: Cek langsung ke database dulu
      this.logger.debug('📊 Checking database directly...');
      const directQuery = await this.prisma.user.findMany({
        take: 3,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });
      this.logger.debug(
        '🗃️ Direct database query result (first 3):',
        directQuery,
      );

      const totalInDB = await this.prisma.user.count();
      this.logger.debug('📈 Total users in database:', totalInDB);

      // Panggil service
      this.logger.debug('📞 Calling usersService.findAll()...');
      const serviceResult = await this.usersService.findAll(
        +skip,
        +take,
        search,
        role,
        isActiveBoolean,
      );

      this.logger.debug('✅ Service returned:', {
        dataLength: serviceResult.data?.length || 0,
        total: serviceResult.total,
        skip: serviceResult.skip,
        take: serviceResult.take,
      });

      if (serviceResult.data && serviceResult.data.length > 0) {
        this.logger.debug('👤 First user from service:', {
          id: serviceResult.data[0].id,
          email: serviceResult.data[0].email,
          name: serviceResult.data[0].name,
          role: serviceResult.data[0].role,
          isActive: serviceResult.data[0].isActive,
        });
      } else {
        this.logger.warn('⚠️ Service returned empty data array!');

        // Debug lebih lanjut
        this.logger.debug('🔍 Debugging empty result...');

        // Cek filter yang diterapkan
        const whereClause: any = {};
        if (search) {
          whereClause.OR = [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ];
        }
        if (role) {
          whereClause.role = role;
        }
        if (isActiveBoolean !== undefined) {
          whereClause.isActive = isActiveBoolean;
        }

        this.logger.debug(
          '🎯 WHERE clause being applied:',
          JSON.stringify(whereClause, null, 2),
        );

        // Hitung dengan where clause yang sama
        const countWithFilters = await this.prisma.user.count({
          where: whereClause,
        });
        this.logger.debug('🎯 Count with current filters:', countWithFilters);
      }

      return serviceResult;
    } catch (error) {
      this.logger.error('❌ Error in findAll:', error);
      throw error;
    }
  }

  @Get('search')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  async search(@Query('q') query: string, @Query('role') role?: Role) {
    this.logger.debug('=== 🔍 GET /users/search called ===');
    this.logger.debug('📋 Query Parameters:', {
      query: query || 'not provided',
      role: role || 'not provided',
    });

    const result = await this.usersService.search(query, role);
    this.logger.debug(`✅ Search returned ${result.length} users`);

    if (result.length > 0) {
      this.logger.debug('👤 Sample results:', result.slice(0, 3));
    }

    return result;
  }

  @Get('role/:role')
  @Roles(Role.ADMIN)
  async findByRole(
    @Param('role') role: Role,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
  ) {
    this.logger.debug('=== 🔍 GET /users/role/:role called ===');
    this.logger.debug('📋 Parameters:', { role, skip, take });

    const result = await this.usersService.findByRole(role, +skip, +take);
    this.logger.debug('✅ Result:', {
      dataLength: result.data.length,
      total: result.total,
    });

    return result;
  }

  @Get('active')
  @Roles(Role.ADMIN)
  async findActive(
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
  ) {
    this.logger.debug('=== 🔍 GET /users/active called ===');
    this.logger.debug('📋 Parameters:', { skip, take });

    const result = await this.usersService.findActive(+skip, +take);
    this.logger.debug('✅ Result:', {
      dataLength: result.data.length,
      total: result.total,
    });

    return result;
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.TEACHER)
  async findOne(@Param('id') id: string) {
    this.logger.debug('=== 🔍 GET /users/:id called ===');
    this.logger.debug('📋 User ID:', id);

    const user = await this.usersService.findOne(id);
    this.logger.debug('✅ User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return user;
  }

  @Get('profile')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.TEACHER)
  async getProfile(@Req() req) {
    this.logger.debug('=== 🔍 GET /users/profile called ===');
    this.logger.debug('📋 Request user:', req.user);

    const userId = req.user?.userId || req.user?.sub;
    this.logger.debug('🔑 Extracted user ID:', userId);

    if (!userId) {
      this.logger.error('❌ No user ID found in request');
      throw new Error('User ID not found');
    }

    const user = await this.usersService.findOne(userId);
    this.logger.debug('✅ Profile retrieved:', {
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return user;
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() createUserDto: CreateUserDto) {
    this.logger.debug('=== ➕ POST /users called ===');
    this.logger.debug('📋 CreateUserDto:', createUserDto);

    const user = await this.usersService.create(createUserDto);
    this.logger.debug('✅ User created:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return user;
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    this.logger.debug('=== ✏️ PATCH /users/:id called ===');
    this.logger.debug('📋 Parameters:', { id, updateUserDto });

    const user = await this.usersService.update(id, updateUserDto);
    this.logger.debug('✅ User updated:', {
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return user;
  }

  @Patch('profile')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.TEACHER)
  async updateProfile(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    this.logger.debug('=== ✏️ PATCH /users/profile called ===');
    this.logger.debug('📋 Request user:', req.user);
    this.logger.debug('📋 UpdateUserDto:', updateUserDto);

    const userId = req.user?.userId || req.user?.sub;
    this.logger.debug('🔑 User ID from request:', userId);

    const user = await this.usersService.update(userId, updateUserDto);
    this.logger.debug('✅ Profile updated:', {
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return user;
  }

  @Patch(':id/toggle-active')
  @Roles(Role.ADMIN)
  async toggleActive(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    this.logger.debug('=== 🔄 PATCH /users/:id/toggle-active called ===');
    this.logger.debug('📋 Parameters:', { id, isActive });

    const user = await this.usersService.toggleActive(id, isActive);
    this.logger.debug('✅ User active status toggled:', {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
    });

    return user;
  }

  @Post(':id/change-password')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.TEACHER)
  async changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: { oldPassword: string; newPassword: string },
  ) {
    this.logger.debug('=== 🔐 POST /users/:id/change-password called ===');
    this.logger.debug('📋 Parameters:', { id });

    await this.usersService.changePassword(id, changePasswordDto);
    this.logger.debug('✅ Password changed successfully for user ID:', id);

    return { message: 'Password changed successfully' };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    this.logger.debug('=== 🗑️ DELETE /users/:id called ===');
    this.logger.debug('📋 User ID to delete:', id);

    await this.usersService.remove(id);
    this.logger.debug('✅ User soft-deleted (isActive = false):', id);
  }

  @Get('check-email')
  @Roles(Role.ADMIN)
  async checkEmailExists(@Query('email') email: string) {
    this.logger.debug('=== 📧 GET /users/check-email called ===');
    this.logger.debug('📋 Email to check:', email);

    const result = await this.usersService.checkEmailExists(email);
    this.logger.debug('✅ Email check result:', result);

    return result;
  }

  @Get('stats')
  @Roles(Role.ADMIN)
  async getStats() {
    this.logger.debug('=== 📊 GET /users/stats called ===');

    const stats = await this.usersService.getStats();
    this.logger.debug('✅ Stats:', stats);

    return stats;
  }

  @Post('bulk')
  @Roles(Role.ADMIN)
  async bulkCreate(@Body() body: { users: CreateUserDto[] }) {
    this.logger.debug('=== 📦 POST /users/bulk called ===');
    this.logger.debug(`📋 Creating ${body.users.length} users`);

    const users = await this.usersService.bulkCreate(body.users);
    this.logger.debug(`✅ ${users.length} users created successfully`);

    return users;
  }

  // 🚨 DEBUG ENDPOINT - Hanya untuk development
  @Get('debug/test')
  async debugTest() {
    this.logger.debug('=== 🐛 DEBUG ENDPOINT /users/debug/test called ===');

    // Test 1: Count all users
    const totalUsers = await this.prisma.user.count();
    this.logger.debug('📊 Total users in database:', totalUsers);

    // Test 2: Get all users (raw, no filters)
    const allUsers = await this.prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    this.logger.debug('👥 All users (first 10):', allUsers);

    // Test 3: Check user stats by isActive
    const activeUsers = await this.prisma.user.count({
      where: { isActive: true },
    });
    const inactiveUsers = await this.prisma.user.count({
      where: { isActive: false },
    });

    this.logger.debug('📈 Active/Inactive stats:', {
      active: activeUsers,
      inactive: inactiveUsers,
      total: totalUsers,
    });

    // Test 4: Check by role
    const roles = await this.prisma.user.groupBy({
      by: ['role', 'isActive'],
      _count: true,
    });

    this.logger.debug('🎭 Users by role and active status:', roles);

    return {
      debugInfo: {
        totalUsers,
        sampleUsers: allUsers,
        activeStats: {
          active: activeUsers,
          inactive: inactiveUsers,
        },
        rolesBreakdown: roles,
        timestamp: new Date().toISOString(),
      },
      message: 'Debug endpoint - check server logs for details',
    };
  }
}
