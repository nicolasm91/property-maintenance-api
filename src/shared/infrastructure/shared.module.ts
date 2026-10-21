import { Global, Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { CLOCK } from '../application/clock.js';
import { ID_GENERATOR } from '../application/id-generator.js';
import { DomainErrorFilter } from './http/domain-error.filter.js';
import { SystemClock } from './system-clock.js';
import { UuidGenerator } from './uuid-generator.js';

@Global()
@Module({
  providers: [
    { provide: CLOCK, useClass: SystemClock },
    { provide: ID_GENERATOR, useClass: UuidGenerator },
    { provide: APP_FILTER, useClass: DomainErrorFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
  exports: [CLOCK, ID_GENERATOR],
})
export class SharedModule {}
