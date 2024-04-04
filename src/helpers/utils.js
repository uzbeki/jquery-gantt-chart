/**
 * Calculates the number of days between two dates.
 *
 * @param {Date} date1 - The first date.
 * @param {Date} date2 - The second date.
 * @returns {number} The number of days between the two dates.
 */
export const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const days = Math.round(Math.abs((date1 - date2) / oneDay));
  return days + 1;
};

export const monthsBetween = (date1, date2) => {
  const months = (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth());
  return months + 1;
};

export const weeksBetween = (date1, date2) => {
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const weeks = Math.round(Math.abs(date1 - date2) / oneWeek);
  return weeks + 1;
};

export const getMonthId = date => {
  return `${date.getFullYear()}-${date.getMonth()}`;
};
