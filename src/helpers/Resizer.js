/**
 * @typedef {Object} ResizerOptions
 * @property {number} [minWidth=10] - The minimum width of the element in pixels.
 * @property {number} [maxWidth=Infinity] - The maximum width of the element in pixels.
 * @property {Function} [onResize=(newWidth) => {}] - The callback function to be called when the element is resized.
 * @property {number} [stepSize=1] - The step size for resizing the element.
 * @property {string} [handleVisibility="hover"] - The visibility of the resize handles. Possible values: "hover" | "click" | "always".
 */
const initialOptions = {
  minWidth: 10,
  maxWidth: Infinity,
  onResize: newWidth => {},
  stepSize: 1,
  handleVisibility: "hover", // "hover" | "click" | "always"
};

class Resizer {
  /**
   * Creates a new instance of the Resizer class.
   * @param {HTMLElement} element - The element to be resized.
   * @param {ResizerOptions} [options=initialOptions] - The options for the Resizer.
   */
  constructor(element, options = initialOptions) {
    this.element = element;
    this.leftHandle = null;
    this.rightHandle = null;
    this.startX = 0;
    this.startWidth = 0;

    this.options = { ...initialOptions, ...options }; // TODO: validate options, ex: minWidth < maxWidth, types
    // Bind the methods in the constructor
    this.startResize = this.startResize.bind(this);
    this.resize = this.resize.bind(this);
    this.stopResize = this.stopResize.bind(this);

    this.shouldIncreaseWidth = false;
    this.initialize();
  }

  /**
   * Initializes the Resizer by creating left and right handles and attaching event listeners.
   */
  initialize() {
    this.leftHandle = document.createElement("div");
    this.leftHandle.classList.add("resizer-handle", "left-handle");
    this.rightHandle = document.createElement("div");
    this.rightHandle.classList.add("resizer-handle", "right-handle");
    this.__handleVisibility();

    this.element.appendChild(this.leftHandle);
    this.element.appendChild(this.rightHandle);

    // this.element.style.position = "relative";

    // Add event listeners for mouse events
    this.leftHandle.addEventListener("mousedown", this.startResize);
    this.rightHandle.addEventListener("mousedown", this.startResize);

    // Add event listeners for touch events
    this.leftHandle.addEventListener("touchstart", this.startResize);
    this.rightHandle.addEventListener("touchstart", this.startResize);
  }

  /**
   * Handles the start of the resize operation.
   * @param {MouseEvent} event - The mouse event object.
   */
  startResize(event) {
    event.preventDefault();
    // Use event.touches[0].clientX for touch events
    this.startX = event.type === "touchstart" ? event.touches[0].clientX : event.clientX;
    this.startWidth = this.__getWidth();

    // If the left handle is clicked, we should increase the width
    this.shouldIncreaseWidth = event.target.classList.contains("left-handle");

    this.element.classList.add("resizing");

    // Add event listeners for mouse events
    document.addEventListener("mousemove", this.resize);
    document.addEventListener("mouseup", this.stopResize);

    // Add event listeners for touch events
    document.addEventListener("touchmove", this.resize);
    document.addEventListener("touchend", this.stopResize);
  }

  /**
   * Resizes the element based on the mouse event.
   * @param {MouseEvent} event - The mouse event object.
   */
  resize(event) {
    // Use event.touches[0].clientX for touch events
    const clientX = event.type === "touchmove" ? event.touches[0].clientX : event.clientX;
    let deltaX = this.shouldIncreaseWidth ? this.startX - clientX : clientX - this.startX;
    if (this.options.stepSize) {
      deltaX = Math.round(deltaX / this.options.stepSize) * this.options.stepSize; // Round to the nearest step size
    }
    let newWidth = this.__clampWidth(this.startWidth + deltaX);
    this.element.style.width = `${newWidth}px`;
  }

  /**
   * Clamps the width value between the minimum and maximum width options.
   * @private
   * @param {number} width - The width value to be clamped.
   * @returns {number} - The clamped width value.
   */
  __clampWidth(width) {
    return Math.min(Math.max(width, this.options.minWidth), this.options.maxWidth);
  }

  /**
   * Get the width of the element.
   * @private
   * @returns {number} The width of the element.
   */
  __getWidth() {
    return parseInt(getComputedStyle(this.element).width, 10);
  }

  __getHandles = () => [this.leftHandle, this.rightHandle];
  __showHandles = () => {
    if (this.element.classList.contains("resizing")) return;
    this.__getHandles().forEach(handle => handle.classList.remove("hidden"));
  };
  __hideHandles = () => {
    if (this.element.classList.contains("resizing")) return;
    this.__getHandles().forEach(handle => handle.classList.add("hidden"));
  };

  __handleVisibility() {
    switch (this.options.handleVisibility) {
      case "always":
        this.__showHandles();
        break;
      case "click" || "touch":
        this.__hideHandles();
        this.element.addEventListener("click", e => {
          this.__getHandles().forEach(handle =>
            // Toggle the hidden class based on the current state
            handle.classList.toggle("hidden", !handle.classList.contains("hidden"))
          );
        });
        this.element.addEventListener("touchstart", e => {
          this.__getHandles().forEach(handle =>
            // Toggle the hidden class based on the current state
            handle.classList.toggle("hidden", !handle.classList.contains("hidden"))
          );
        });
        break;
      default:
        this.__hideHandles();
        this.element.addEventListener("mouseenter", this.__showHandles);
        this.element.addEventListener("mouseleave", this.__hideHandles);
        break;
    }
  }

  /**
   * Stops the resizing operation and removes event listeners.
   * Calls the `onResize` callback with the current width.
   */
  stopResize(e) {
    this.element.classList.remove("resizing");

    if (this.options.handleVisibility !== "always") this.__hideHandles();

    // Remove event listeners for mouse events
    document.removeEventListener("mousemove", this.resize);
    document.removeEventListener("mouseup", this.stopResize);

    // Remove event listeners for touch events
    document.removeEventListener("touchmove", this.resize);
    document.removeEventListener("touchend", this.stopResize);

    const width = this.__getWidth();
    this.options.onResize(width);

    // Fire a custom resize event
    const resizeEvent = new CustomEvent("resize", { detail: { width, delta: width - this.startWidth } });
    this.element.dispatchEvent(resizeEvent);
  }
}

export default Resizer;
