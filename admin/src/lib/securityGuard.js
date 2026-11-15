/* Enterprise Anti-Inspect and Security Guard for Super Admin Console */

export function initSecurityGuard() {
  if (typeof window === 'undefined') return;

  /* 1. Disable Right Click Context Menu */
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  }, { capture: true });

  /* 2. Disable DevTools and Source Viewing Keyboard Shortcuts */
  window.addEventListener('keydown', (e) => {
    const isCtrlOrMeta = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    const key = e.key ? e.key.toUpperCase() : '';
    const keyCode = e.keyCode;

    /* F12 key */
    if (key === 'F12' || keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    /* Ctrl+Shift+I (Inspect), Ctrl+Shift+J (Console), Ctrl+Shift+C (Element picker) */
    if (isCtrlOrMeta && isShift && (key === 'I' || key === 'J' || key === 'C')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    /* Ctrl+U (View Source) */
    if (isCtrlOrMeta && key === 'U') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    /* Ctrl+S (Save Page) */
    if (isCtrlOrMeta && key === 'S') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { capture: true });

  /* 3. DevTools Console Warning Banner */
  try {
    const bannerStyle = 'color: #c084fc; font-size: 20px; font-weight: bold; text-shadow: 1px 1px 2px black;';
    const warningStyle = 'color: #f59e0b; font-size: 13px; font-weight: bold;';
    console.log('%cAutoReply Master Console', bannerStyle);
    console.log('%cRestricted Administrative Zone: Unauthorized access, reverse engineering, and inspection are strictly prohibited.', warningStyle);
  } catch (err) {
    /* Ignore console errors */
  }
}

