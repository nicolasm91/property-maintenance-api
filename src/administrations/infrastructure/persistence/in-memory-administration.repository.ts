import { Administration } from '../../domain/administration.js';
import { AdministrationRepository } from '../../domain/administration.repository.js';

/** Storage-free adapter, used by tests. */
export class InMemoryAdministrationRepository implements AdministrationRepository {
  private readonly items = new Map<string, Administration>();

  findById(id: string) {
    return Promise.resolve(this.items.get(id) ?? null);
  }

  findAll() {
    return Promise.resolve(
      [...this.items.values()].sort((a, b) => a.name.localeCompare(b.name)),
    );
  }

  exists(id: string) {
    return Promise.resolve(this.items.has(id));
  }

  save(administration: Administration) {
    this.items.set(administration.id, administration);
    return Promise.resolve();
  }
}
