import { InvariantViolationError } from '../../shared/domain/errors.js';
import { Address } from './address.js';
import { AdministrationAssignment } from './administration-assignment.js';
import { PropertyAlreadyAssignedError } from './property.errors.js';
import { Property } from './property.js';

const address = Address.create({
  street: 'Av. Corrientes',
  number: '1234',
  postalCode: 'C1043',
  intersection: 'Talcahuano and Libertad',
});
const t0 = new Date('2026-01-01T00:00:00Z');
const t1 = new Date('2026-06-01T00:00:00Z');

const newProperty = () =>
  Property.create({ id: 'p1', type: 'building', address, now: t0 });

describe('Property', () => {
  it('starts without administration', () => {
    const property = newProperty();
    expect(property.administrationId).toBeNull();
    expect(property.assignments).toHaveLength(0);
  });

  it('opens the first assignment', () => {
    const property = newProperty();
    property.assignAdministration({
      administrationId: 'a1',
      assignmentId: 'as1',
      at: t0,
    });

    expect(property.administrationId).toBe('a1');
    expect(property.assignments).toHaveLength(1);
    expect(property.assignments[0].isOpen).toBe(true);
  });

  it('closes the current assignment and opens a new one at the same instant', () => {
    const property = newProperty();
    property.assignAdministration({
      administrationId: 'a1',
      assignmentId: 'as1',
      at: t0,
    });
    property.assignAdministration({
      administrationId: 'a2',
      assignmentId: 'as2',
      at: t1,
    });

    const [previous, current] = property.assignments;
    expect(previous.endedAt).toEqual(t1);
    expect(current).toMatchObject({
      administrationId: 'a2',
      startedAt: t1,
      isOpen: true,
    });
    expect(property.administrationId).toBe('a2');
    expect(property.updatedAt).toEqual(t1);
  });

  it('rejects assigning the administration it already has', () => {
    const property = newProperty();
    property.assignAdministration({
      administrationId: 'a1',
      assignmentId: 'as1',
      at: t0,
    });

    expect(() =>
      property.assignAdministration({
        administrationId: 'a1',
        assignmentId: 'as2',
        at: t1,
      }),
    ).toThrow(PropertyAlreadyAssignedError);
    expect(property.assignments).toHaveLength(1);
  });

  it('refuses to rehydrate with more than one open assignment', () => {
    const open = (id: string) =>
      AdministrationAssignment.rehydrate({
        id,
        administrationId: id,
        startedAt: t0,
        endedAt: null,
      });

    expect(() =>
      Property.rehydrate({
        id: 'p1',
        type: 'building',
        address,
        assignments: [open('a1'), open('a2')],
        createdAt: t0,
        updatedAt: t0,
      }),
    ).toThrow(InvariantViolationError);
  });
});

describe('Address', () => {
  it('trims values and rejects blank ones', () => {
    expect(
      Address.create({
        street: ' Corrientes ',
        number: '1',
        postalCode: 'C1',
        intersection: 'x',
      }).street,
    ).toBe('Corrientes');
    expect(() =>
      Address.create({
        street: '  ',
        number: '1',
        postalCode: 'C1',
        intersection: 'x',
      }),
    ).toThrow(InvariantViolationError);
  });
});
