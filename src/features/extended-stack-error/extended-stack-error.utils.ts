import * as Constants from './extended-stack-error.constants';

export const getAdditionalStackInfo = (info: Record<string, any>): string => {
  return ` \n\n${Constants.EXTENDED_STACK_ADDITIONAL_INFO_TEXT}: ${JSON.stringify(info, null, 2)}\n\n`;
};
