import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import {
  HealthResponseDto,
  DetailedHealthResponseDto,
} from './dto/health-response.dto';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async checkHealth(): Promise<HealthResponseDto> {
    return this.healthService.checkHealth();
  }

  @Get('detailed')
  async checkDetailedHealth(): Promise<DetailedHealthResponseDto> {
    return this.healthService.checkDetailedHealth();
  }
}
