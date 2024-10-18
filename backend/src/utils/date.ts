export const oneYearFromNow = () => {
  return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
};

export const thirtyMinutesFromNow = () => {
  return new Date(Date.now() + 30 * 60 * 1000);
};

export const oneDayFromNow = () => {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
};
