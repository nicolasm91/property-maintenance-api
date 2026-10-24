import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { AvailabilityQueryDto } from './dto/availability-query.dto.js';
import { FindTradesmenQueryDto } from './dto/find-tradesmen-query.dto.js';
import { Tradesman } from './entities/tradesman.entity.js';
import { TradesmenService } from './tradesmen.service.js';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('tradesmen')
@Controller('tradesmen')
@Roles('directClient')
export class TradesmenController {
  constructor(private readonly tradesmenService: TradesmenService) {}

  @Get()
  @ApiOperation({ summary: 'Independent tradesmen who have the trade.' })
  findAll(@Query() query: FindTradesmenQueryDto): Promise<Tradesman[]> {
    return this.tradesmenService.findAll(query);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: "The tradesman's free future slots on a day (YYYY-MM-DD, platform time zone)." })
  findAvailability(@Param('id', ParseUUIDPipe) id: string, @Query() query: AvailabilityQueryDto): Promise<Date[]> {
    return this.tradesmenService.findAvailability(id, query);
  }
}
