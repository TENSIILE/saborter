import * as Constants from './generate-uuid.constants';

let counter = 0;

/**
 * Returns a random hex character (0 – f).
 */
const getRandomHex = (): string => {
  return Math.floor(Math.random() * 16).toString(16);
};

/**
 * Generates a UUID version 4 using Date.now(), a counter, and Math.random.
 *
 * @returns {string} UUID in format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export const generateUuid = (): string => {
  // eslint-disable-next-line no-bitwise
  counter = (counter + 1) & 0xffff;

  const timestamp = Date.now();

  const timeHex = timestamp
    .toString(16)
    .padStart(Constants.TIMESTAMP_HEX_LENGTH, '0')
    .slice(0, Constants.TIMESTAMP_HEX_LENGTH);

  const counterHex = counter.toString(16).padStart(Constants.COUNTER_HEX_LENGTH, '0');

  const randomHex = Array.from({ length: Constants.RANDOM_HEX_LENGTH }, () => getRandomHex()).join('');

  const fullHex = timeHex + counterHex + randomHex;

  const parts: string[] = [];
  let start = 0;

  for (let i = 0; i < Constants.UUID_BLOCK_LENGTHS.length; i++) {
    parts.push(fullHex.slice(start, start + (Constants.UUID_BLOCK_LENGTHS[i] ?? 0)));
    start += Constants.UUID_BLOCK_LENGTHS[i] ?? 0;
  }

  parts[2] = `${Constants.UUID_V4_VERSION_SYMBOL}${parts[2]?.slice(1)}`;

  const variantDigit = (Math.floor(Math.random() * 4) + 8).toString(16);
  parts[3] = variantDigit + (parts[3]?.slice(1) ?? '');

  let result = '';

  for (let i = 0; i < parts.length; i++) {
    if (i > 0) result += Constants.DASH_SYMBOL;

    result += parts[i];
  }

  return result;
};
