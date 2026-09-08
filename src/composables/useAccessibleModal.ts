import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  type Ref,
} from 'vue';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useAccessibleModal(
  modalRef: Ref<HTMLElement | null>,
  onClose: () => void,
): void {
  let previouslyFocusedElement: HTMLElement | null = null;

  function getFocusableElements(): HTMLElement[] {
    if (!modalRef.value) {
      return [];
    }

    return Array.from(
      modalRef.value.querySelectorAll<HTMLElement>(
        FOCUSABLE_SELECTOR,
      ),
    ).filter(
      element =>
        !element.hasAttribute('disabled') &&
        element.getAttribute('aria-hidden') !== 'true',
    );
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = getFocusableElements();

    if (focusableElements.length === 0) {
      event.preventDefault();
      modalRef.value?.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement =
      focusableElements[focusableElements.length - 1];

    if (
      event.shiftKey &&
      document.activeElement === firstElement
    ) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (
      !event.shiftKey &&
      document.activeElement === lastElement
    ) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  onMounted(async () => {
    previouslyFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    document.addEventListener(
      'keydown',
      handleKeydown,
    );

    await nextTick();

    const focusableElements =
      getFocusableElements();

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else {
      modalRef.value?.focus();
    }
  });

  onBeforeUnmount(() => {
    document.removeEventListener(
      'keydown',
      handleKeydown,
    );

    previouslyFocusedElement?.focus();
  });
}