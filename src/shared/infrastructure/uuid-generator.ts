import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { IdGenerator } from '../application/id-generator.js';

@Injectable()
export class UuidGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
