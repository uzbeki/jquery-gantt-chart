import { SCALES } from "./initials.js";

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

/**
 * Adjusts the given date by the specified amount and scale.
 *
 * @param {Date} dateToAdjust - The date to adjust.
 * @param {number} amount - The amount by which to adjust the date.
 * @param {string} scale - The scale of the adjustment (hours, days, weeks, months, years).
 * @returns {Date} - The adjusted date.
 */
export const adjustDate = (dateToAdjust, amount, scale) => {
  const date = new Date(dateToAdjust);
  switch (scale) {
    case "hours":
      // TODO: BUG, hour scale is 0, 12, and the amount is 1, it will change only by one hour
      console.log({ date, amount, newDate: date.getHours() + amount });
      date.setHours(date.getHours() + amount);
      break;
    case "days":
      date.setDate(date.getDate() + amount);
      break;
    case "weeks":
      date.setDate(date.getDate() + amount * 7);
      break;
    case "months":
      date.setMonth(date.getMonth() + amount);
      break;
    case "years":
      date.setFullYear(date.getFullYear() + amount);
      break;
    default:
      break;
  }
  return date;
};

/**
 *
 * @param {import("./initials").Scale} scale
 * @param {boolean} zoomIn
 */
export const getNextScale = (scale, zoomIn) => {
  const index = SCALES.indexOf(scale);
  return SCALES[index + (zoomIn ? -1 : 1)] || scale;
};

export const canChangeScale = (nextScale, minScale, maxScale, zoomIn) => {
  if (zoomIn) {
    return SCALES.indexOf(nextScale) >= SCALES.indexOf(minScale);
  }
  return SCALES.indexOf(nextScale) <= SCALES.indexOf(maxScale);
  // return ["months", "weeks", "days"].includes(nextScale);
};


/**
 * Counts the number of work days between two dates.
 * Ignores Saturdays and Sundays and provided holidays.
 * @param {Date} startDate - The start date.
 * @param {Date} endDate - The end date.
 * @param {Array<Date>} holidays - An array of holiday dates.
 * @returns {number} The number of work days between the two dates.
 */
export const countWorkDays = (startDate, endDate, holidays=[]) => {
  if (startDate > endDate) throw new Error("Start date must be before end date.");
  let count = 0;
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6 && !holidays.includes(currentDate)) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return count;
}