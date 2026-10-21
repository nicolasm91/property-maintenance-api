import { InvariantViolationError } from '../../shared/domain/errors.js';
import { Administration } from './administration.js';

describe('Administration', () => {
  const now = new Date('2026-01-01T00:00:00Z');

  it('trims the name', () => {
    expect(
      Administration.create({ id: 'a1', name: '  Admin SA ', now }).name,
    ).toBe('Admin SA');
  });

  it('rejects a blank name', () => {
    expect(() => Administration.create({ id: 'a1', name: '   ', now })).toThrow(
      InvariantViolationError,
    );
  });
});
