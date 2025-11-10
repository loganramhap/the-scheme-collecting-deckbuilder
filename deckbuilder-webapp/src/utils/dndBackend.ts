import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';

/**
 * Detect if the device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - for older browsers
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Get the appropriate DnD backend based on device capabilities
 */
export function getDndBackend() {
  return isTouchDevice() ? TouchBackend : HTML5Backend;
}

/**
 * Get backend options for touch devices
 */
export function getDndBackendOptions() {
  if (isTouchDevice()) {
    return {
      enableMouseEvents: true, // Allow mouse events on touch devices
      delayTouchStart: 200, // Delay before drag starts (allows scrolling)
      ignoreContextMenu: true,
    };
  }
  return {};
}
