import { Administration } from '../entities/administration.entity.js';

// Contract that services depend on, never a concrete database. It is an
// abstract class (not an interface) so Nest can use it as the injection
// token; the implementation is bound in AdministrationsModule.
export abstract class AdministrationsRepository {
  abstract create(data: { name: string }): Promise<Administration>;
  abstract findById(id: string): Promise<Administration | null>;
  abstract findAll(): Promise<Administration[]>;
}
