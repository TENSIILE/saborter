import { generateUuid } from './generate-uuid';

describe('generateUuid', () => {
  test('should return a string of length 36', () => {
    const uuid = generateUuid();

    expect(uuid).toHaveLength(36);
  });

  test('should match the UUID v4 format', () => {
    const uuid = generateUuid();

    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    expect(uuid).toMatch(regex);
  });

  test('should have version 4 (third block starts with "4")', () => {
    const uuid = generateUuid();

    const versionChar = uuid[14];

    expect(versionChar).toBe('4');
  });

  test('should have RFC 4122 variant (fourth block starts with 8,9,a,b)', () => {
    const uuid = generateUuid();

    const variantChar = uuid[19];

    expect(variantChar).toMatch(/[89ab]/i);
  });

  test('should generate unique values for many calls', () => {
    const uuids = new Set<string>();

    const ITERATIONS = 1_000_000;

    for (let i = 0; i < ITERATIONS; i++) {
      uuids.add(generateUuid());
    }

    expect(uuids.size).toBe(ITERATIONS);
  });

  test('should not throw any exceptions', () => {
    expect(() => generateUuid()).not.toThrow();
  });
});
