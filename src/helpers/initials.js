const DEFAULT_CELL_SIZE = 24;
/**
 * @typedef {Object} MovableOptions
 * @property {number} [stepSize=1] - The step size for resizing the element.
 * @property {boolean} [horizontal=true] - Whether the element can be moved horizontally (left and right).
 * @property {boolean} [vertical=true] - Whether the element can be moved vertically (up and down).
 * @property {number} [minX=0] - The minimum value for the left position.
 * @property {number} [minY=0] - The minimum value for the top position.
 * @property {number} [maxX=Number.POSITIVE_INFINITY] - The maximum value for the left position.
 * @property {number} [maxY=Number.POSITIVE_INFINITY] - The maximum value for the top position.
 */

/** @type {MovableOptions} */
export const initialMovableOptions = {
  stepSize: DEFAULT_CELL_SIZE,
  horizontal: true,
  vertical: false,
  minX: 0,
  minY: 0,
  maxX: Number.POSITIVE_INFINITY,
  maxY: Number.POSITIVE_INFINITY,
};

/**
 * @typedef {Object} ResizerOptions
 * @property {number} [minWidth=10] - The minimum width of the element in pixels.
 * @property {number} [maxWidth=Infinity] - The maximum width of the element in pixels.
 * @property {Function} [onResize=(newWidth) => {}] - The callback function to be called when the element is resized.
 * @property {number} [stepSize=1] - The step size for resizing the element.
 * @property {string} [handleVisibility="hover"] - The visibility of the resize handles. Possible values: "hover" | "click" | "always".
 * @property {boolean} [leftHandle=false] - Whether to show the left handle.
 * @property {boolean} [rightHandle=true] - Whether to show the right handle.
 */

/** @type {ResizerOptions} */
export const initialResizerOptions = {
  minWidth: DEFAULT_CELL_SIZE,
  maxWidth: Infinity,
  onResize: newWidth => {},
  stepSize: DEFAULT_CELL_SIZE,
  handleVisibility: "hover", // "hover" | "click" | "always"
  leftHandle: false,
  rightHandle: true,
};

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
 * @property {Date|null} from - Start date of the value object
 * @property {Date|null} to - End date of the value object
 * @property {string} label - Label of the value object
 * @property {string} desc - Description of the value object
 * @property {string} customClass - Custom class for coloring bars
 */

/** @typedef {"months" | "weeks" | "days" | "half days" | "every 8 hours" | "every 6 hours" | "every 3 hours" | "every hour"} Scale */

/**
 * @typedef {Object} Settings
 * @property {Source} source - Source data for the chart
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
 * @property {{resizability: ResizerOptions, movability: MovableOptions}} barOptions - Options for bar resizing and moving
 * @property {function(data: Object): void} onItemClick - Callback function for item click event
 * @property {function(dt: Date, rowId: number): void} onAddClick - Callback function for add click event
 * @property {function(): void} onRender - Callback function for render event
 * @property {function(page: number, pageSize: number): Promise<Source>} onGetPage - Callback function for get page event
 * @property {function(pageSize: number, currentPage:number): Promise<Source>} onPageSizeChange - Callback function for get page event
 * @property {function(bar: Object, data: Object): void} onBarResize - Callback function for bar resize event
 */

/** @type {Settings} */
export const initialSettings = {
  source: {},
  scale: "days",
  maxScale: "months",
  // minScale: "every hour",
  minScale: "hour",
  cellSize: DEFAULT_CELL_SIZE,
  scrollToToday: false,
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
  barOptions: {
    resizability: initialResizerOptions,
    movability: initialMovableOptions,
  },
  onItemClick: data => {},
  onAddClick: (dt, rowId) => {},
  onRender: () => {},
  onGetPage: async (page, pageSize) => {},
  onPageSizeChange: async (pageSize, currentPage) => {},
  onBarResize: (bar, data) => {},
};
