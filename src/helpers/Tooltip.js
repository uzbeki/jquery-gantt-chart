/**
 * @typedef {Object} TooltipOptions
 * @property {string} title - title of the tooltip
 * @property {string} content - content of the tooltip
 * @property {"left" | "right" | "top" | "bottom"} position - position of the tooltip
 * @property {number} space - space between the element and the tooltip
 */

/** @type {TooltipOptions} */
const initialTooltipOptions = { title: "", content: "", position: "top", space: 15, delay: 0 };

/**
 * Represents a Tooltip.
 * @example
 * ```js
 * const element = document.getElementById("element");
 * const tooltip = new Tooltip(element, {
 *   title: "Tooltip Title",
 *   content: "Tooltip Content",
 *   position: "top",
 *   space: 15
 * });
 * ```
 */
export default class Tooltip {
  /**
   * Tooltip constructor
   * @param {HTMLElement} element - The element to attach the tooltip to.
   * @param {TooltipOptions} options - The options for the tooltip.
   * @returns {Tooltip}
   */
  constructor(element, options = initialTooltipOptions) {
    this.element = element;
    this.options = { ...initialTooltipOptions, ...options };

    this.tooltipElement = document.createElement("div");
    this.tooltipElement.classList.add("gantt-tooltip");
    this.tooltipElement.innerHTML = `
            <h3 class="tooltip-title">${this.options.title}</h3>
            <p class="tooltip-content">${this.options.content}</p>
        `;
    this.tooltipElement.dataset.position = this.options.position;

    this.showTooltip = this.showTooltip.bind(this);
    this.hideTooltip = this.hideTooltip.bind(this);

    this.element.addEventListener("mouseenter", this.showTooltip);
    this.element.addEventListener("mouseleave", this.hideTooltip);
  }

  /** Shows the tooltip.
   * @param {MouseEvent} event - The mouse event that triggered the tooltip. */
  showTooltip(event) {
    document.body.appendChild(this.tooltipElement);

    const elementRect = this.element.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (this.options.position) {
      case "left":
        top = elementRect.top + elementRect.height / 2 - tooltipRect.height / 2;
        left = elementRect.left - tooltipRect.width - this.options.space;
        break;
      case "right":
        top = elementRect.top + elementRect.height / 2 - tooltipRect.height / 2;
        left = elementRect.right + this.options.space;
        break;
      case "top":
        top = elementRect.top - tooltipRect.height - this.options.space;
        left = elementRect.left + elementRect.width / 2 - tooltipRect.width / 2;
        break;
      case "bottom":
        top = elementRect.bottom + this.options.space;
        left = elementRect.left + elementRect.width / 2 - tooltipRect.width / 2;
        break;
    }

    if (!this.isElementInViewport()) {
      // If the tooltip is not in the viewport, adjust the position to fit in the viewport.
      if (top < 0) top = 0;
      if (left < 0) left = 0;
      if (top + tooltipRect.height > window.innerHeight) top = window.innerHeight - tooltipRect.height;
      if (left + tooltipRect.width > window.innerWidth) left = window.innerWidth - tooltipRect.width;

    }
    this.tooltipElement.style.top = `${top}px`;
    this.tooltipElement.style.left = `${left}px`;
  }

  /** Hides the tooltip. */
  hideTooltip() {
    if (document.body.contains(this.tooltipElement)) document.body.removeChild(this.tooltipElement);
  }

  isElementInViewport() {
    const rect = this.element.getBoundingClientRect();
    return rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
  }

  /** Unmounts (removes) the tooltip. */
  unmount() {
    this.element.removeEventListener("mouseenter", this.showTooltip);
    this.element.removeEventListener("mouseleave", this.hideTooltip);
    this.tooltipElement.remove();
  }

  /**
   * Refreshes the tooltip with new options.
   * @param {TooltipOptions} options - The options for the tooltip. */
  refresh(options) {
    console.log("refresh", options);
    this.options = { ...this.options, ...options };
    this.tooltipElement.innerHTML = `
            <h3 class="tooltip-title">${this.options.title}</h3>
            <p class="tooltip-content">${this.options.content}</p>
        `;
    this.tooltipElement.dataset.position = this.options.position;
  }
}
