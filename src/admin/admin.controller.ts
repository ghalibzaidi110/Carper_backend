import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  AdminUserFilterDto,
  AdminUpdateUserDto,
  AdminSendNotificationDto,
} from './dto';
import { Roles } from '../common/decorators';

@ApiTags('Admin')
@Controller('admin')
@ApiBearerAuth()
@Roles('ADMIN')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ─── USER MANAGEMENT ──────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'Get all users (paginated, filterable)' })
  async getUsers(@Query() filters: AdminUserFilterDto) {
    return this.adminService.getUsers(filters);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user detail' })
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user (status, type, verification)' })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.adminService.updateUser(id, dto);
  }

  // ─── VERIFICATION QUEUE ───────────────────────────────────────

  @Get('verifications')
  @ApiOperation({ summary: 'Get pending CNIC verifications' })
  async getPendingVerifications(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getPendingVerifications(page, limit);
  }

  // ─── NOTIFICATIONS ────────────────────────────────────────────

  @Post('notifications')
  @ApiOperation({ summary: 'Send system notification to users' })
  async sendNotification(@Body() dto: AdminSendNotificationDto) {
    return this.adminService.sendNotification(dto);
  }

  // ─── ANALYTICS ────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Get platform analytics & stats' })
  async getStats() {
    return this.adminService.getPlatformStats();
  }
}
