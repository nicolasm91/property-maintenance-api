import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CancelTaskDto } from './dto/cancel-task.dto.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto.js';
import { RejectTaskDto } from './dto/reject-task.dto.js';
import type { Task, TaskEvent } from './entities/task.entity.js';
import { type DirectClient, TasksService, type TradesmanUser } from './tasks.service.js';

@Controller('tasks')
@Roles('directClient', 'tradesman')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles('directClient')
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: DirectClient): Promise<Task> {
    return this.tasksService.create(dto, user);
  }

  @Get()
  findAll(@Query() query: FindTasksQueryDto, @CurrentUser() user: DirectClient | TradesmanUser): Promise<Task[]> {
    return this.tasksService.findAll(query, user);
  }

  @Post(':id/complete')
  @Roles('tradesman')
  @HttpCode(HttpStatus.OK)
  complete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: TradesmanUser): Promise<Task> {
    return this.tasksService.complete(id, user);
  }

  @Post(':id/reject')
  @Roles('tradesman')
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectTaskDto,
    @CurrentUser() user: TradesmanUser,
  ): Promise<Task> {
    return this.tasksService.reject(id, dto, user);
  }

  @Post(':id/cancel')
  @Roles('directClient')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelTaskDto,
    @CurrentUser() user: DirectClient,
  ): Promise<Task> {
    return this.tasksService.cancel(id, dto, user);
  }

  @Get(':id/events')
  findEvents(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: DirectClient | TradesmanUser,
  ): Promise<TaskEvent[]> {
    return this.tasksService.findEvents(id, user);
  }
}
