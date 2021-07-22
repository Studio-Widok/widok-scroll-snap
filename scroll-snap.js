import $ from 'cash-dom';
import widok from 'widok';
import createScrollItem from 'widok-scroll-item';

const MIN_TIME_BETWEEN_PART_CHANGES = 500;
const MIN_TIME_BETWEEN_WHEEL_EVENTS = 100;
const SCROLL_PER_WHEEL_EVENT = 300;

function getEventDelta(event) {
  const delta = event.wheelDelta || -event.detail;
  return Math.max(-1, Math.min(1, delta));
}

function isPartBottomBelowScreenTop(part, delta) {
  return part.offset + part.height > widok.s - 10 * delta;
}

function isPartBottomAboveScreenBottom(part, delta) {
  return part.offset + part.height < widok.s + widok.h - 10 * delta;
}

function willPartBottomBeAboveScreenBottom(part) {
  return part.offset + part.height < widok.s + widok.h + SCROLL_PER_WHEEL_EVENT;
}

function willPartTopBeBelowScreenTop(part) {
  return part.offset > widok.s - SCROLL_PER_WHEEL_EVENT;
}

/**
 * @typedef {Object} options
 * @property {string} part selector with elements that should be treated as
 * scrollable parts.
 */

class ScrollSnap {
  constructor(options) {
    this.parts = [];
    $(options.part).map((i, e) => this.parts.push(createScrollItem(e)));
    this.wasPartScrolled = false;
    this.lastWheelEvent = 0;

    window.addEventListener('mousewheel', this.mouseWheelHandlerCaller.bind(this), { passive: false });
    window.addEventListener('DOMMouseScroll', this.mouseWheelHandlerCaller.bind(this), { passive: false });

    window.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown') {
        mouseWheelHandler(-1);
        event.preventDefault();
      } else if (event.key === 'ArrowUp') {
        mouseWheelHandler(1);
        event.preventDefault();
      }
    });
  }

  wasCalledRecently() {
    const now = new Date().getTime();
    const wasCalledRecently = this.lastWheelEvent + MIN_TIME_BETWEEN_WHEEL_EVENTS > now;
    this.lastWheelEvent = now;
    return wasCalledRecently;
  }

  preventDefaultScroll(event) {
    if (this.wasPartScrolled || this.wasCalledRecently()) {
      event.returnValue = false;
      event.preventDefault();
    }
  }

  mouseWheelHandlerCaller(event) {
    if (widok.w <= 900) return;
    if (event.ctrlKey) return;

    this.mouseWheelHandler(event);
    this.preventDefaultScroll(event);
  }

  scrollToTarget(target, delta = 0) {
    if (delta > 0) target -= widok.h;
    window.scrollTo({ top: target, behavior: 'smooth' });
    this.wasPartScrolled = true;
    setTimeout(() => { this.wasPartScrolled = false; }, MIN_TIME_BETWEEN_PART_CHANGES);
  }

  preventOverscrolling(part, delta) {
    if (delta < 0 && willPartBottomBeAboveScreenBottom(part)) {
      this.scrollToTarget(part.offset + part.height - widok.h);
    }
    else if (delta > 0 && willPartTopBeBelowScreenTop(part)) {
      this.scrollToTarget(part.offset);
    }
  }

  mouseWheelHandler(event) {
    if (this.wasPartScrolled) return;

    const delta = getEventDelta(event);

    for (const part of this.parts) {
      if (isPartBottomBelowScreenTop(part, delta)) {
        if (isPartBottomAboveScreenBottom(part, delta)) {
          this.scrollToTarget(part.offset + part.height, delta);
        } else {
          this.preventOverscrolling(part, delta);
        }
        break;
      }
    }
  };
}

/**
 * initialize scroll snapping
 * @param {options} options
 * @returns {Object} scrollSnap
 */
function createScrollSnap(options) {
  return new ScrollSnap(options);
}

export default createScrollSnap;