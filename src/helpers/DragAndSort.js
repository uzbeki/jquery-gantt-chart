"use strict";
class DragAndSortManager {
  LOCAL_STORAGE_KEY = "dragAndDropOrder";

  /**
   * Represents a draggable container with sorting functionality.
   * @constructor
   * @param {string} dragContainer - The selector for the drag container element.
   * @param {boolean} [enableOrderSaving=true] - Indicates whether to enable order saving.
   */
  constructor(dragContainer, { enableOrderSaving = true, onSort = () => {}, lsKeyName = "dragAndDropOrder" }) {
    this.dragContainer = document.querySelector(dragContainer);
    if (!this.dragContainer) return console.error("Drag container not found: ", dragContainer);
    this.draggables = this.dragContainer.children;
    this.draggingElement = null;
    this.enableOrderSaving = enableOrderSaving;
    this.onSort = onSort;
    this.LOCAL_STORAGE_KEY = lsKeyName;

    this.initializeDragAndDrop();
    this.sortDraggables();
  }

  /**
   * Initializes the drag and drop functionality.
   */
  initializeDragAndDrop() {
    for (const d of this.draggables) {
      d.setAttribute("draggable", true);
      d.classList.add("draggable");
      d.addEventListener("dragstart", this.handleDragStart.bind(this));
      d.addEventListener("dragend", this.handleDragEnd.bind(this));

      // Touch event listeners
      d.addEventListener("touchstart", this.handleTouchStart.bind(this));
      d.addEventListener("touchmove", this.handleTouchMove.bind(this));
      d.addEventListener("touchend", this.handleTouchEnd.bind(this));
    }

    this.dragContainer.addEventListener("dragover", this.handleDragOver.bind(this));

    // Touch event listener for the drag container
    this.dragContainer.addEventListener("touchmove", this.handleTouchMove.bind(this));
  }

  /**
   * Handles the drag start event.
   *
   * @param {Event} e - The drag start event object.
   */
  handleDragStart(e) {
    this.draggingElement = e.target;
    this.draggingElement.classList.add("dragging");
  }

  /**
   * Handles the drag end event.
   */
  handleDragEnd() {
    this.draggingElement.classList.remove("dragging");
    if (this.enableOrderSaving) {
      this.saveOrder();
    }
    this.onSort(this.__getOrder());
  }

  /**
   * Adds a draggable element to the drag container.
   * @param {number} y - The y-coordinate of the element.
   */
  __addDraggableElement(y) {
    const afterElement = this.getDragAfterElement(y);
    if (afterElement === null) {
      this.dragContainer.appendChild(this.draggingElement);
    } else {
      this.dragContainer.insertBefore(this.draggingElement, afterElement);
    }
  }

  /**
   * Handles the drag over event.
   *
   * @param {DragEvent} e - The drag event object.
   */
  handleDragOver(e) {
    e.preventDefault();
    this.__addDraggableElement(e.clientY);
  }

  handleTouchStart = this.handleDragStart;

  handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.__addDraggableElement(touch.clientY);
  }

  handleTouchEnd = this.handleDragEnd;

  /**
   * Returns the element after which a dragged element should be inserted based on the given y-coordinate.
   * @param {number} y - The y-coordinate of the dragged element.
   * @returns {Element|null} - The element after which the dragged element should be inserted, or null if there is no suitable element.
   */
  getDragAfterElement(y) {
    const draggableElements = [...this.dragContainer.querySelectorAll(".draggable:not(.dragging)")];
    const res = draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      { offset: Number.NEGATIVE_INFINITY, element: null }
    );

    return res.element;
  }

  /**
   * Saves the order of the drag container children to the local storage.
   * @returns {void}
   */
  saveOrder() {
    if (!this.enableOrderSaving) return;
    const order = this.dragContainer.children;
    const orderIds = [...order].map(o => o.id);
    localStorage.setItem(this.LOCAL_STORAGE_KEY, orderIds);
  }

  /**
   * Sorts the draggables based on the order stored in the local storage.
   * If order saving is disabled, the local storage is cleared and the method returns.
   * Otherwise, it retrieves the order from the local storage, maps it to the corresponding draggable elements,
   * clears the drag container, and appends the draggables in the new order.
   */
  sortDraggables() {
    if (!this.enableOrderSaving) {
      localStorage.removeItem(this.LOCAL_STORAGE_KEY);
      return;
    }
    const order = this.__getOrder();
    if (!order.length) return;
    const draggables = order.map(id => document.getElementById(id));
    const draggableIds = draggables.map(d => d.id);
    
    // check if the number of draggable elements is the same as the saved order
    if (draggables.length !== this.draggables.length) {
      console.warn("Mismatch in number of draggable elements and saved order.");
      return;
    }
    // check if all draggable elements are present in the saved order
    if (!order.every((id) => draggableIds.some(d => d === id))) {
      console.warn("Mismatch in draggable elements and saved order.");
      return;
    }
    // check if the order is already the same
    if (draggables.every((d, i) => d === this.draggables[i])) return;
    this.dragContainer.innerHTML = "";
    draggables.forEach(d => this.dragContainer.appendChild(d));
  }

  __getOrder = () => getOrder(this.LOCAL_STORAGE_KEY);
}

export const getOrder = key => localStorage.getItem(key)?.split(",") || [];

export default DragAndSortManager;
