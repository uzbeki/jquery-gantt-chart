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
const initialOptions = {
  stepSize: 1,
  horizontal: true,
  vertical: false,
  minX: 0,
  minY: 0,
  maxX: Number.POSITIVE_INFINITY,
  maxY: Number.POSITIVE_INFINITY,
};

class Movable {
  constructor(element, options = initialOptions) {
    this.element = element;
    this.options = { ...initialOptions, ...options };

    // move with mouse
    this.element.addEventListener("mousedown", this.handleMouseDown.bind(this));
    document.addEventListener("mousemove", this.handleMouseMove.bind(this));
    document.addEventListener("mouseup", this.handleMouseUp.bind(this));

    // move with touch
    this.element.addEventListener("touchstart", this.handleMouseDown.bind(this));
    document.addEventListener("touchmove", this.handleMouseMove.bind(this));
    document.addEventListener("touchend", this.handleMouseUp.bind(this));
  }

  handleMouseDown(event) {
    if (this.element.classList.contains("resizing")) return;
    event.preventDefault();
    this.startX = event.type === "mousedown" ? event.clientX : event.touches[0].clientX;
    this.startY = event.type === "mousedown" ? event.clientY : event.touches[0].clientY;
    this.offsetLeft = this.element.offsetLeft;
    this.offsetTop = this.element.offsetTop;
    this.isDragging = true;
  }

  handleMouseMove(event) {
    if (!this.isDragging) return;
    event.preventDefault();
    if (this.options.horizontal) {
      const clientX = event.type === "mousemove" ? event.clientX : event.touches[0].clientX;
      const _deltaX = clientX - this.startX;
      const deltaX = Math.round(_deltaX / this.options.stepSize);
      let newX = this.offsetLeft + deltaX * this.options.stepSize;
      newX = this.__clamp(newX, this.options.minX, this.options.maxX);
      this.element.style.left = `${newX}px`;
    }

    if (this.options.vertical) {
      const clientY = event.type === "mousemove" ? event.clientY : event.touches[0].clientY;
      const _deltaY = clientY - this.startY;
      const deltaY = Math.round(_deltaY / this.options.stepSize);
      let newY = this.offsetTop + deltaY * this.options.stepSize;
      newY = this.__clamp(newY, this.options.minY, this.options.maxY);
      this.element.style.top = `${newY}px`;
    }
  }

  handleMouseUp() {
    this.isDragging = false;

    const moveEvent = new CustomEvent("move", {
      detail: {
        left: this.element.offsetLeft,
        top: this.element.offsetTop,
      },
    });
    this.element.dispatchEvent(moveEvent);
  }

  __clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
}

export default Movable;
