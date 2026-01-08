export const get = <T, R>(object: T, path: string) =>
  path.split('.').reduce((acc, key) => acc && (acc as Record<string, any>)[key], object) as unknown as R;
