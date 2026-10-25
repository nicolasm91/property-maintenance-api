import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CancelTaskDto } from './dto/cancel-task.dto.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto.js';
import { RejectTaskDto } from './dto/reject-task.dto.js';
import type { Task, TaskEvent } from './entities/task.entity.js';
import { type DirectClientCaller, TasksService, type TradesmanCaller } from './tasks.service.js';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('tasks')
@Controller('tasks')
@Roles('directClient', 'tradesman')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles('directClient')
  @ApiOperation({
    summary: "Book a free slot of an independent tradesman for one of the caller's homes. 409 if the slot is taken.",
  })
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: DirectClientCaller): Promise<Task> {
    return this.tasksService.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary:
      "The caller's tasks by scheduledAt: a tradesman's agenda (without cancelled or rejected tasks), or every task a direct client created.",
  })
  findAll(
    @Query() query: FindTasksQueryDto,
    @CurrentUser() user: DirectClientCaller | TradesmanCaller,
  ): Promise<Task[]> {
    return this.tasksService.findAll(query, user);
  }

  @Post(':id/complete')
  @Roles('tradesman')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark an assigned task as completed.' })
  complete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: TradesmanCaller): Promise<Task> {
    return this.tasksService.complete(id, user);
  }

  @Post(':id/reject')
  @Roles('tradesman')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Reject an assigned task, with an optional reason. A direct client task ends as rejected and frees the slot.',
  })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectTaskDto,
    @CurrentUser() user: TradesmanCaller,
  ): Promise<Task> {
    return this.tasksService.reject(id, dto, user);
  }

  @Post(':id/cancel')
  @Roles('directClient')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an unassigned or assigned task, with a mandatory reason.' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelTaskDto,
    @CurrentUser() user: DirectClientCaller,
  ): Promise<Task> {
    return this.tasksService.cancel(id, dto, user);
  }

  @Get(':id/events')
  @ApiOperation({ summary: "The task's history, oldest first." })
  findEvents(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: DirectClientCaller | TradesmanCaller,
  ): Promise<TaskEvent[]> {
    return this.tasksService.findEvents(id, user);
  }
}
