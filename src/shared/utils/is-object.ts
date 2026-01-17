export const isObject = (value: any): boolean => {
  return value !== null && !Array.isArray(value) && typeof value === 'object';
};
