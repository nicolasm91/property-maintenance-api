import { Administration } from '../entities/administration.entity.js';

// Abstract class instead of an interface: interfaces don't exist at runtime,
// so Nest couldn't use one as the injection token.
export abstract class AdministrationsRepository {
  abstract create(data: { name: string }): Promise<Administration>;
  abstract findById(id: string): Promise<Administration | null>;
  abstract findAll(): Promise<Administration[]>;
}
