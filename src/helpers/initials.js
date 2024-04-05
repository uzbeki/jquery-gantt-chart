/**
 * @typedef {Object} Source
 * @property {SourceData[]} data - Array of data objects
 * @property {number} currentPage - Current page number
 * @property {number} pageCount - Total number of pages
 * @property {number} itemsPerPage - Number of items per page
 */

/**
 * @typedef {Object} SourceData
 * @property {number} id - ID of the data object
 * @property {string} name - Name of the data object
 * @property {string} desc - Description of the data object
 * @property {Value[]} values - Array of value objects
 */

/**
 * @typedef {Object} Value
 * @property {Date} from - Start date of the value object
 * @property {Date} to - End date of the value object
 * @property {string} label - Label of the value object
 * @property {string} desc - Description of the value object
 * @property {string} customClass - Custom class for coloring bars
 */

/** @typedef {"months" | "weeks" | "days" | "half days" | "every 8 hours" | "every 6 hours" | "every 3 hours" | "every hour"} Scale */

/**
 * @typedef {Object} Settings
 * @property {Source} source - Source data for the chart
 * @property {"buttons" | "scroll"} navigate - Navigation type ("buttons" or "scroll")
 * @property {Scale} scale - Scale of the chart ("years", "months", "weeks", "days", "half days", "every 8 hours", "every 6 hours", "every 3 hours", "every hour")
 * @property {Scale} maxScale - Maximum scale of the chart ("months", "weeks", "days", "half days", "every 8 hours", "every 6 hours", "every 3 hours", "every hour")
 * @property {Scale} minScale - Minimum scale of the chart ("hours", "days", "weeks", "months", "years")
 * @property {number} cellSize - Size of each cell in pixels
 * @property {boolean} scrollToToday - Whether to scroll to today's date on load
 * @property {boolean} rememberZoomLevel - Whether to remember the current zoom level
 * @property {string} zoomLevelKey - Key to store the zoom level in local storage
 * @property {boolean} rememberHeaderOrder - Whether to remember the header order
 * @property {number} itemsPerPage - Number of items per page
 * @property {Array<string>} dow - Array of day of week labels
 * @property {Array<string>} months - Array of month labels
 * @property {Array<string>} holidays - Array of holiday dates
 * @property {function(data: Object): void} onItemClick - Callback function for item click event
 * @property {function(dt: Date, rowId: number): void} onAddClick - Callback function for add click event
 * @property {function(): void} onRender - Callback function for render event
 * @property {function(page: number): Promise<void>} onGetPage - Callback function for get page event
 * @property {function(bar: Object, data: Object): void} onBarResize - Callback function for bar resize event
 */

/** @type {Settings} */
export const initialSettings = {
  source: {},
  navigate: "scroll",
  scale: "days",
  maxScale: "months",
  // minScale: "every hour",
  minScale: "hour",
  cellSize: 24,
  scrollToToday: true,
  rememberZoomLevel: true,
  zoomLevelKey: "jquery-gantt-chart-zoom-level",
  rememberHeaderOrder: true,
  itemsPerPage: 10,
  dow: ["S", "M", "T", "W", "T", "F", "S"],
  months: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  holidays: [],
  onItemClick: data => {},
  onAddClick: (dt, rowId) => {},
  onRender: () => {},
  onGetPage: async page => {},
  onBarResize: (bar, data) => {},
};

/** @type {Scale[]} */
// export const SCALES = [
//   "months",
//   "weeks",
//   "days",
//   "half days",
//   "every 8 hours",
//   "every 6 hours",
//   "every 3 hours",
//   "every hour",
// ];
export const SCALES = ["hours", "days", "weeks", "months"];

/** @type {Record<Scale, number>} */
export const ZOOM_LEVELS = {
  months: 4,
  weeks: 3,
  days: 4,
  "half days": 5,
  "every 8 hours": 5,
  "every 6 hours": 5,
  "every 3 hours": 5,
  "every hour": 5,
};
