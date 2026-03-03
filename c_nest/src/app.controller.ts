import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from './common/decorators';

@ApiTags('Root')
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'API health check and welcome message' })
  getWelcome() {
    return {
      message: 'Hello from Carper API 🚗',
      version: '1.0.0',
      status: 'running',
      docs: '/api/docs',
      endpoints: {
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        cars: '/api/v1/user-cars',
        marketplace: '/api/v1/car-listings',
        rentals: '/api/v1/rentals',
        damageDetection: '/api/v1/damage-detection',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
