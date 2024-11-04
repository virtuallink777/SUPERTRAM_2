export const oneYearFromNow = () => {
  return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
};

export const thirtyMinutesFromNow = () => {
  return new Date(Date.now() + 30 * 60 * 1000);
};

export const oneDayFromNow = () => {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
};

export const ONE_DAY_MS = 24 * 60 * 60 ** 1000;

export const thirtyDaysFromNow = () => {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
};

export const fiveMinutesAgo = () => new Date(Date.now() - 5 * 60 * 1000);

export const oneHourFromNow = () => new Date(Date.now() + 60 * 60 * 1000);
