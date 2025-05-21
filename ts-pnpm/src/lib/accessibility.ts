/**
 * Accessibility utility functions for focus management, keyboard navigation,
 * and ARIA compliance.
 */

/**
 * Trap focus within a specified element - useful for modals, dropdowns, etc.
 * @param containerRef - Reference to the container element
 * @param event - Keyboard event
 */
export const trapFocus = (containerRef: React.RefObject<HTMLElement>, event: React.KeyboardEvent) => {
  if (!containerRef.current || event.key !== 'Tab') return;
  
  const focusableElements = containerRef.current.querySelectorAll(
    'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  // If shift+tab and on first element, move to last element
  if (event.shiftKey && document.activeElement === firstElement) {
    lastElement?.focus();
    event.preventDefault();
  }
  // If tab and on last element, move to first element
  else if (!event.shiftKey && document.activeElement === lastElement) {
    firstElement?.focus();
    event.preventDefault();
  }
};

/**
 * Handle keyboard navigation for dropdown menus
 * @param event - Keyboard event
 * @param items - Array of dropdown items
 * @param closeMenu - Function to close the dropdown
 */
export const handleMenuKeyDown = (
  event: React.KeyboardEvent,
  items: HTMLElement[],
  closeMenu: () => void
) => {
  const currentIndex = items.findIndex(item => item === document.activeElement);
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      if (currentIndex < items.length - 1) {
        items[currentIndex + 1].focus();
      } else {
        items[0].focus();
      }
      break;
      
    case 'ArrowUp':
      event.preventDefault();
      if (currentIndex > 0) {
        items[currentIndex - 1].focus();
      } else {
        items[items.length - 1].focus();
      }
      break;
      
    case 'Escape':
      event.preventDefault();
      closeMenu();
      break;
      
    case 'Home':
      event.preventDefault();
      items[0].focus();
      break;
      
    case 'End':
      event.preventDefault();
      items[items.length - 1].focus();
      break;
  }
};

/**
 * Return keyboard event handlers for accessible navigation
 * @param onEnter - Function to execute on Enter key press
 * @param onEscape - Function to execute on Escape key press
 * @param onSpace - Function to execute on Space key press
 */
export const accessibleKeyboardEventHandler = (
  onEnter?: () => void,
  onEscape?: () => void,
  onSpace?: () => void
) => {
  return (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        if (onEnter) {
          event.preventDefault();
          onEnter();
        }
        break;
        
      case 'Escape':
        if (onEscape) {
          event.preventDefault();
          onEscape();
        }
        break;
        
      case ' ':
        if (onSpace) {
          event.preventDefault();
          onSpace();
        }
        break;
    }
  };
}; 