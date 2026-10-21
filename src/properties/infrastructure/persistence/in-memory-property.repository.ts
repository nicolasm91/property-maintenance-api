import { Property } from '../../domain/property.js';
import { PropertyRepository } from '../../domain/property.repository.js';

/** Storage-free adapter, used by tests. */
export class InMemoryPropertyRepository implements PropertyRepository {
  private readonly items = new Map<string, Property>();

  findById(id: string) {
    return Promise.resolve(this.items.get(id) ?? null);
  }

  save(property: Property) {
    this.items.set(property.id, property);
    return Promise.resolve();
  }
}
