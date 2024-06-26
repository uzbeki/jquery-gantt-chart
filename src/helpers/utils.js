/**
 * Calculates the number of days between two dates.
 *
 * @param {Date} date1 - The first date.
 * @param {Date} date2 - The second date.
 * @returns {number} The number of days between the two dates.
 */
export const daysBetween = (_date1, _date2) => {
  // TODO: faulty logic, need to fix, not used currently
  if (!_date1 || !_date2 || _date1 === _date2) return 0;
  const [date1, date2] = [new Date(_date1), new Date(_date2)];
  const oneDay = 24 * 60 * 60 * 1000;
  const diff = Math.abs(date1 - date2);
  if (date1.toDateString() === date2.toDateString()) return 1;
  let days = Math.ceil(diff / oneDay);
  // days = diff % oneDay === 0 ? days + 1 : days; // add one day if the difference is a multiple of one day, to include the last day
  return days;
};

// export const daysBetween = (_date1, _date2) => {
//   if (!_date1 || !_date2 || _date1 === _date2) return 0;
//   const [date1, date2] = [new Date(_date1), new Date(_date2)];
//   // date1.setHours(0, 0, 0, 0);
//   // date2.setHours(0, 0, 0, 0);
//   if (date1.toDateString() === date2.toDateString()) return 1;
//   const dates = new Set();
//   let currentDate = new Date(date1)
//   while (currentDate < date2) {
//     dates.add(currentDate.toDateString());
//     currentDate.setDate(currentDate.getDate() + 1);
//   }
//   return dates.size + 1;
// };

export const monthsBetween = (_date1, _date2) => {
  // TODO: faulty logic, need to fix, not used currently
  if (!_date1 || !_date2 || _date1 === _date2) return 0;
  const [date1, date2] = [new Date(_date1), new Date(_date2)];
  const oneMonth = 30 * 24 * 60 * 60 * 1000;
  const diff = Math.abs(date1 - date2);
  const months = Math.ceil(diff / oneMonth);
  return months;
};

export const weeksBetween = (date1, date2) => {
  if (!date1 || !date2 || date1 === date2) return 0;
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const diff = Math.abs(date1 - date2);
  const weeks = Math.ceil(diff / oneWeek);
  return weeks;
};

/** @param {Date} date */
export const getMonthId = date => `${date.getFullYear()}-${date.getMonth()}`;

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
    case "every hour":
    case "every 3 hours":
    case "every 6 hours":
    case "every 8 hours":
    case "half days":
      const step = SCALE_HOUR_STEPS[scale];
      date.setHours(date.getHours() + amount * step);
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
 * Counts the number of work days between two dates.
 * Ignores Saturdays and Sundays and provided holidays.
 * @param {Date} startDate - The start date.
 * @param {Date} endDate - The end date.
 * @param {Array<Date>} holidays - An array of holiday dates.
 * @returns {number} The number of work days between the two dates.
 */
export const countWorkDays = (startDate, endDate, holidays = []) => {
  if (startDate > endDate) throw new Error(`Start date cannot be greater than end date. ${startDate} > ${endDate}`);
  let days = 0;
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const isHoliday = holidays.some(holiday => areDatesEqual(holiday, currentDate));
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6 && !isHoliday) {
      days++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return days;
};

/**
 * Calculates the navigation values based on the target, scale, and cell size.
 *
 * @param {"prevWeek"|"nextWeek"|"prevDay"|"nextDay"} target - The target navigation value (prevWeek, nextWeek, prevDay, nextDay).
 * @param {import("./initials").Scale} scale - The scale of the navigation (hours, days, weeks, months).
 * @param {number} cellSize - The size of the cell.
 * @returns {number} - The calculated navigation value.
 */
export const getNavigationValues = (target, scale, cellSize) => {
  const navigationValues = {
    prevWeek: { hours: 8, days: 30, weeks: 12, months: 6 },
    nextWeek: { hours: -8, days: -30, weeks: -12, months: -6 },
    prevDay: { hours: 4, days: 7, weeks: 4, months: 3 },
    nextDay: { hours: -4, days: -7, weeks: -4, months: -3 },
  };

  const def = navigationValues[target].weeks * cellSize; // default value
  return navigationValues[target][scale] * cellSize || def;
};

/**
 * Validates the source object.
 * @param {import("./initials.js").Source} source - The source object to validate.
 * @returns {{isValid:boolean, source:import("./initials.js").Source, minDate: number, maxDate: number}} - The validation result.
 */
export const sanitizeSource = source => {
  let isValid = false;
  let minDate = Infinity;
  let maxDate = -Infinity;
  try {
    if (!source) throw new Error("Source object is required.");
    if (!source.data || !source.currentPage || !source.itemsPerPage || !source.pageCount) {
      throw new Error("Source object is missing required properties: data, currentPage, itemsPerPage, pageCount.");
    }
    if (parseInt(source.currentPage) !== source.currentPage)
      throw new Error(`Current page must be an integer. ${source.currentPage}`);
    if (parseInt(source.itemsPerPage) !== source.itemsPerPage)
      throw new Error(`Items per page must be an integer. ${source.itemsPerPage}`);
    if (parseInt(source.pageCount) !== source.pageCount)
      throw new Error(`Page count must be an integer. ${source.pageCount}`);
    source.currentPage = parseInt(source.currentPage);
    source.itemsPerPage = parseInt(source.itemsPerPage);
    source.pageCount = parseInt(source.pageCount);
    if (source.currentPage > source.pageCount)
      throw new Error(`Current page cannot be greater than page count. ${source.currentPage} > ${source.pageCount}`);
    if (source.currentPage < 1) throw new Error(`Current page cannot be less than 1. ${source.currentPage}`);
    if (source.itemsPerPage < 1) throw new Error(`Items per page cannot be less than 1. ${source.itemsPerPage}`);
    if (source.pageCount < 1) throw new Error(`Page count cannot be less than 1. ${source.pageCount}`);
    if (!Array.isArray(source.data)) throw new Error(`Source.data must be an array. ${source.data}`);
    if (source.data.length < 1) throw new Error(`Source.data must contain at least one item. ${source.data}`);

    source.data.forEach(item => {
      if (!item.id || !item.name || !item.values) {
        throw new Error(
          `Each item in Source.data must have an id, name, and values property. ${JSON.stringify(item, null, 2)}`
        );
      }
      if (!Array.isArray(item.values)) {
        throw new Error(
          `Values property of each item in Source.data must be an array. ${JSON.stringify(item.values, null, 2)}`
        );
      }
      item.values.forEach(value => {
        if (value.from) {
          const from = new Date(value.from);
          if (isNaN(from)) throw new Error(`Value.from must be a valid date. ${value.from}`);
          from.setMinutes(0, 0, 0);
          value.from = from.getTime();
          if (value.from < minDate) minDate = value.from;
        }
        if (value.to) {
          const to = new Date(value.to);
          if (isNaN(to)) throw new Error(`Value.to must be a valid date. ${value.to}`);
          to.setMinutes(0, 0, 0);
          value.to = to.getTime();
          if (value.to > maxDate) maxDate = value.to;
        }
      });
    });
    isValid = true;
  } catch (error) {
    console.error(error);
  }
  return { isValid, source, minDate, maxDate };
};

export const areDatesEqual = (_date1, _date2) => {
  const [date1, date2] = [new Date(_date1), new Date(_date2)];
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

/**
 * Converts a date to a scale.
 * @param {number} date - The date to convert in milliseconds.
 * @param {import("./initials").Scale} scale - The scale to convert the date to.
 * @returns {string} - The converted date in the specified scale.
 */
export const dateToScale = (_date, scale) => {
  if (!_date) return "";
  const date = new Date(_date);
  switch (scale) {
    case "weeks":
      return date.toLocaleDateString();
    case "months":
      return date.toLocaleDateString();
    default: // hours, days
      return date.toLocaleString();
  }
};

/**
 * gets the minimum and maximum dates from the source
 * @param {import("./initials").SourceData} data */
export const getMinMaxDates = data => {
  let minDate = Infinity;
  let maxDate = -Infinity;
  data.forEach(item => {
    item.values.forEach(value => {
      if (value.from && value.from < minDate) minDate = value.from;
      if (value.to && value.to > maxDate) maxDate = value.to;
    });
  });
  return [new Date(minDate), new Date(maxDate)];
};

/**
 *
 * @param {Date} minDate
 * @param {Date} maxDate
 * @param {import("./initials.js").Scale} scale
 * @returns {[Date, Date]} */
export const padMinMaxDatesByScale = (minDate, maxDate, scale) => {
  const [min, max] = [new Date(minDate), new Date(maxDate)];
  const PAD_AMOUNT = 5; // pad by 5 cells
  if (scale === "every hour" || scale === "hours") {
    min.setHours(min.getHours() - PAD_AMOUNT);
    max.setHours(max.getHours() + PAD_AMOUNT);
  } else if (scale === "every 3 hours") {
    min.setHours(min.getHours() - PAD_AMOUNT * 3);
    max.setHours(max.getHours() + PAD_AMOUNT * 3);
  } else if (scale === "every 6 hours") {
    min.setHours(min.getHours() - PAD_AMOUNT * 6);
    max.setHours(max.getHours() + PAD_AMOUNT * 6);
  } else if (scale === "every 8 hours") {
    min.setHours(min.getHours() - PAD_AMOUNT * 8);
    max.setHours(max.getHours() + PAD_AMOUNT * 8);
  } else if (scale === "half days") {
    min.setHours(min.getHours() - PAD_AMOUNT * 12);
    max.setHours(max.getHours() + PAD_AMOUNT * 12);
  } else if (scale === "days") {
    min.setDate(min.getDate() - PAD_AMOUNT);
    max.setDate(max.getDate() + PAD_AMOUNT);
  } else if (scale === "weeks") {
    min.setDate(min.getDate() - PAD_AMOUNT * 7);
    max.setDate(max.getDate() + PAD_AMOUNT * 7);
  } else if (scale === "months") {
    min.setMonth(min.getMonth() - PAD_AMOUNT);
    max.setMonth(max.getMonth() + PAD_AMOUNT);
  }
  return [min, max];
};

/**
 * Generates a range of dates based on the given minimum and maximum dates, scale, and interval.
 *
 * @param {Date} minDate - The minimum date of the range.
 * @param {Date} maxDate - The maximum date of the range.
 * @param {import("./initials.js").Scale} scale - The scale of the range (e.g., "hours", "days", "weeks", "months").
 * @param {number} [n=1] - The interval for each step in the range.
 * @returns {Date[]} - An array of dates representing the range.
 */
export const generateNScaleRange = (minDate, maxDate, scale, n = 1) => {
  const range = [];
  if (!minDate || !maxDate || !scale) return range;
  console.log({ minDate, maxDate, scale, n });
  const currentDate = new Date(minDate);
  while (currentDate <= maxDate) {
    range.push(new Date(currentDate));
    if (scale === "hours" || scale === "every hour") {
      currentDate.setHours(currentDate.getHours() + n);
    } else if (scale === "every 3 hours") {
      currentDate.setHours(currentDate.getHours() + n * 3);
    } else if (scale === "every 6 hours") {
      currentDate.setHours(currentDate.getHours() + n * 6);
    } else if (scale === "every 8 hours") {
      currentDate.setHours(currentDate.getHours() + n * 8);
    } else if (scale === "half days") {
      currentDate.setHours(currentDate.getHours() + n * 12);
    } else if (scale === "days") {
      currentDate.setDate(currentDate.getDate() + n);
    } else if (scale === "weeks") {
      currentDate.setDate(currentDate.getDate() + n * 7);
    } else if (scale === "months") {
      currentDate.setMonth(currentDate.getMonth() + n);
    }
  }
  return range;
};

export const parseCSVDates = async file => {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = event => {
      const csvString = event.target.result;
      const dates = csvString
        .split("\n")
        .map(l => new Date(l.split(",")[0]))
        .filter(d => d && !isNaN(d));
      resolve(dates);
    };
    reader.onerror = error => {
      reject(error);
    };
    reader.readAsText(file);
  });
};

/**
 * Returns one scale unit based on the current scale.
 *
 * @param {import("./initials").Scale} scale
 * @returns {number} next cell value
 */
export const getOneScaleValue = scale => {
  if (scale === "hours") return 60 * 60 * 1000;
  if (scale === "every hour") return 60 * 60 * 1000;
  if (scale === "every 3 hours") return 3 * 60 * 60 * 1000;
  if (scale === "every 6 hours") return 6 * 60 * 60 * 1000;
  if (scale === "every 8 hours") return 8 * 60 * 60 * 1000;
  if (scale === "half days") return 12 * 60 * 60 * 1000;
  if (scale === "days") return 24 * 60 * 60 * 1000;
  if (scale === "weeks") return 7 * 24 * 60 * 60 * 1000;
  if (scale === "months") return 30 * 24 * 60 * 60 * 1000; // TODO BUG: months are not fixed
  return 60 * 60 * 1000;
};

export const SCALE_HOUR_STEPS = {
  hours: 1,
  "every hour": 1,
  "every 3 hours": 3,
  "every 6 hours": 6,
  "every 8 hours": 8,
  "half days": 12,
};

/** @type {Record<import("./initials.js").Scale, number>} */
export const SCALE_HEADER_COUNT = {
  months: 2,
  weeks: 3,
  days: 4,
  "half days": 5,
  "every 8 hours": 5,
  "every 6 hours": 5,
  "every 3 hours": 5,
  "every hour": 5,
  hours: 5,
};

// ORDER MATTERS as it is used in the zoom in/out buttons, descending order
export const HOUR_SCALES = ["half days", "every 8 hours", "every 6 hours", "every 3 hours", "every hour"];

/** @type {import("./initials").Scale[]} */
export const NEW_SCALES = ["months", "weeks", "days", ...HOUR_SCALES];

/**
 * Returns one scale unit based on the current scale.
 *
 * @param {import("./initials").Scale} _scale
 * @param {boolean} zoomIn
 * @returns {{nextScale: import("./initials").Scale | undefined, headers: number | undefined}} next scale value or undefined if not found
 */
export const getNextZoomScale = (_scale, zoomIn) => {
  if (!_scale) return { nextScale: undefined, headers: undefined}
  const scale = _scale === "hours" ? "every hour" : _scale;
  const index = NEW_SCALES.indexOf(scale);
  const res = NEW_SCALES[index + (zoomIn ? 1 : -1)];
  console.log({ scale, zoomIn, res, headers: SCALE_HEADER_COUNT[res] });
  return { nextScale: res, headers: SCALE_HEADER_COUNT[res] };
};

export const getHourlyTimeRange = (from, to, step = 1) => {
  const year = from.getFullYear();
  const month = from.getMonth();
  const date = from.getDate();
  const hour = from.getHours() - (from.getHours() % step); // round down to the nearest step
  const range = [];
  let h = 0,
    i = 0;
  do {
    range[i] = new Date(year, month, date, hour + h++ * step);
    // overwrite any hours repeated due to DST changes
    if (i > 0 && range[i].getHours() === range[i - 1].getHours()) {
      i--;
    }
  } while (range[i++] < to);
  return range;
};

/**
 * Returns the difference between the two values, scaled by the given scale.
 * @param {number} original - The original value.
 * @param {number} changed - The changed value.
 * @param {import("./initials").Scale} scale - The scale by which to adjust the difference.
 * @returns {number} - The scaled difference.
 */
export const getScaledDifference = (original, changed, scale) => {
  const diff = changed - original;
  if (HOUR_SCALES.includes(scale)) {
    // hour_scales are in hours, so we need to convert the difference to hours without steps
    const oneScale = getOneScaleValue("every hour");
    return `${Math.round(diff / oneScale)} hours`;
  }
  const oneScale = getOneScaleValue(scale);
  return `${Math.round(diff / oneScale)} ${scale}`;
};
