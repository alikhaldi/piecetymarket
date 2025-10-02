// UI Fixes: placeholder fallback, mobile toggles, global error banner
(function () {
  // Safe placeholder SVG data URI (No external asset needed)
  const PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="Arial" font-size="20">No Image</text></svg>';

  // Utility to set image with fallback
  function setImageWithFallback(imgEl, src) {
    try {
      if (!imgEl) return;
      imgEl.src = src || PLACEHOLDER_IMG;
      imgEl.addEventListener('error', function handler() {
        imgEl.removeEventListener('error', handler);
        imgEl.src = PLACEHOLDER_IMG;
      });
    } catch (e) {
      console.warn('setImageWithFallback error', e);
    }
  }

  // Apply fallback to existing <img> tags (only if missing or empty src)
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('img').forEach(img => {
      if (!img.getAttribute('src') || img.getAttribute('src').trim() === '') {
        setImageWithFallback(img, null);
      } else {
        // ensure onerror fallback is present
        img.addEventListener('error', function handler() {
          img.removeEventListener('error', handler);
          img.src = PLACEHOLDER_IMG;
        });
      }
    });
  });

  // Global error banner for easier debugging (visible in-page)
  window.addEventListener('error', (e) => {
    console.error('Global error detected:', e.error || e.message);
    if (document.getElementById('js-error-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'js-error-banner';
    banner.style = 'position:fixed;left:8px;bottom:8px;z-index:9999;padding:10px;background:#fee;border:1px solid #f99;color:#900;font-family:Arial,Helvetica,sans-serif;font-size:13px;border-radius:6px;display:flex;align-items:center;gap:10px;';
    banner.innerHTML = '<span>JS error — open DevTools Console for details</span><button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;font-size:16px;cursor:pointer;">&times;</button>';
    document.body.appendChild(banner);
  });

  // Mobile menu & mobile filters toggles
  function $(id) { return document.getElementById(id); }
  function addClass(el, cls) { if (el) el.classList.add(cls); }
  function removeClass(el, cls) { if (el) el.classList.remove(cls); }
  
  // Helper function to check if the document is in RTL mode
  function isRTL() {
    return document.documentElement.getAttribute('dir') === 'rtl';
  }
  
  function openMobileMenu() {
    const mobileMenu = $('mobile-menu');
    const mobileBackdrop = $('mobile-menu-backdrop');
    if (!mobileMenu) return;

    // Use a conditional class based on the text direction
    const translateClass = isRTL() ? 'translate-x-full' : '-translate-x-full';
    removeClass(mobileMenu, translateClass);
    
    removeClass(mobileMenu, 'invisible');
    removeClass(mobileMenu, 'opacity-0');
    mobileMenu.setAttribute('aria-hidden', 'false');
    if (mobileBackdrop) { removeClass(mobileBackdrop, 'invisible'); removeClass(mobileBackdrop, 'opacity-0'); }
    const btn = $('mobile-menu-btn'); if (btn) btn.setAttribute('aria-expanded','true');
  }
  function closeMobileMenu() {
    const mobileMenu = $('mobile-menu');
    const mobileBackdrop = $('mobile-menu-backdrop');
    if (!mobileMenu) return;

    // Use a conditional class based on the text direction
    const translateClass = isRTL() ? 'translate-x-full' : '-translate-x-full';
    addClass(mobileMenu, translateClass);
    
    addClass(mobileMenu, 'invisible');
    addClass(mobileMenu, 'opacity-0');
    mobileMenu.setAttribute('aria-hidden', 'true');
    if (mobileBackdrop) { addClass(mobileBackdrop, 'invisible'); addClass(mobileBackdrop, 'opacity-0'); }
    const btn = $('mobile-menu-btn'); if (btn) btn.setAttribute('aria-expanded','false');
  }

  function openMobileFilters() {
    const modal = $('mobile-filters-modal');
    if (!modal) return;

    // The modal is off-screen to the right in LTR, so we remove the `translate-x-full` class to show it.
    // For RTL, the CSS should place it off-screen to the left using a different class, e.g., `-translate-x-full`.
    // The JS should simply remove the appropriate class.
    const translateClass = isRTL() ? '-translate-x-full' : 'translate-x-full';
    removeClass(modal, translateClass);

    removeClass(modal, 'invisible');
    modal.setAttribute('aria-hidden','false');
  }
  function closeMobileFilters() {
    const modal = $('mobile-filters-modal');
    if (!modal) return;

    const translateClass = isRTL() ? '-translate-x-full' : 'translate-x-full';
    addClass(modal, translateClass);

    addClass(modal, 'invisible');
    modal.setAttribute('aria-hidden','true');
  }

  document.addEventListener('DOMContentLoaded', function () {
    const mobileMenuBtn = $('mobile-menu-btn');
    const mobileMenuClose = $('mobile-menu-close-btn');
    const mobileBackdrop = $('mobile-menu-backdrop');

    const mobileFiltersBtn = $('show-filters-btn') || $('show-filters');
    const mobileFiltersClose = $('mobile-filters-close-btn');
    const mobileFiltersApply = $('mobile-apply-filters-btn');

    mobileMenuBtn && mobileMenuBtn.addEventListener('click', openMobileMenu);
    mobileMenuClose && mobileMenuClose.addEventListener('click', closeMobileMenu);
    mobileBackdrop && mobileBackdrop.addEventListener('click', closeMobileMenu);

    mobileFiltersBtn && mobileFiltersBtn.addEventListener('click', openMobileFilters);
    mobileFiltersClose && mobileFiltersClose.addEventListener('click', closeMobileFilters);
    mobileFiltersApply && mobileFiltersApply.addEventListener('click', closeMobileFilters);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
        closeMobileFilters();
      }
    });
  });

  // Expose helper (optional)
  window.PiecetyUI = {
    setImageWithFallback,
    PLACEHOLDER_IMG
  };

})();
