function bookingHref() {
  if (typeof SITE !== 'undefined' && SITE.bookingUrl) {
    return SITE.bookingUrl;
  }
  return '#discovery-call';
}

function configureBookingLinks() {
  document.querySelectorAll('[data-booking-link]').forEach(function (el) {
    el.href = bookingHref();
  });
}

function getHeaderScrollOffset() {
  const header = document.querySelector('.site-header');
  if (header) {
    return header.getBoundingClientRect().height;
  }
  return 80;
}

function syncHeaderScrollOffset() {
  const offset = getHeaderScrollOffset();
  document.documentElement.style.setProperty('--header-height', offset + 'px');
  return offset;
}

function scrollToHash(behavior) {
  const hash = window.location.hash;
  if (!hash || hash === '#') return false;
  if (hash === '#privacy') {
    const privacy = document.getElementById('privacy');
    if (privacy && 'open' in privacy) privacy.open = true;
  }
  const target = document.querySelector(hash);
  if (!target) return false;
  const offset = syncHeaderScrollOffset();
  target.style.scrollMarginTop = offset + 'px';
  target.scrollIntoView({ block: 'start', behavior: behavior || 'auto' });
  return true;
}

function scrollUntilHashAligned(behavior) {
  const hash = window.location.hash;
  if (!hash || hash === '#') return;

  const target = document.querySelector(hash);
  if (!target) return;

  let attempts = 0;
  function tryScroll() {
    scrollToHash(behavior || 'auto');
    const offset = getHeaderScrollOffset();
    const top = target.getBoundingClientRect().top;
    const aligned = top >= offset - 8 && top <= offset + 32;
    if (!aligned && attempts < 30) {
      attempts += 1;
      setTimeout(tryScroll, 100);
    }
  }

  tryScroll();
}

function scheduleHashScroll(behavior) {
  function run() {
    scrollUntilHashAligned(behavior);
  }

  if (document.readyState === 'complete') {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(run);
    } else {
      run();
    }
    return;
  }

  window.addEventListener('load', function () {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(run);
    } else {
      run();
    }
  }, { once: true });
}

function isBookingReturn() {
  return new URLSearchParams(window.location.search).get('call-booked') === '1';
}

function handleBookingReturn() {
  if (!isBookingReturn()) return;

  const ctaBlock = document.getElementById('discovery-call-cta');
  const successBlock = document.getElementById('discovery-call-success');
  if (ctaBlock) ctaBlock.hidden = true;
  if (successBlock) successBlock.hidden = false;
}

function initBookingReturn() {
  if (!isBookingReturn()) return;

  function scrollToBookingCard() {
    const target = document.getElementById('discovery-call');
    if (!target) return;
    const offset = getHeaderScrollOffset();
    const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
  }

  function scrollUntilCardVisible() {
    const target = document.getElementById('discovery-call');
    if (!target) return;

    let attempts = 0;
    function tryScroll() {
      scrollToBookingCard();
      const offset = getHeaderScrollOffset();
      const top = target.getBoundingClientRect().top;
      const aligned = top >= offset - 24 && top <= offset + 48;
      if (!aligned && attempts < 24) {
        attempts += 1;
        setTimeout(tryScroll, 100);
      }
    }

    tryScroll();
  }

  function finalizeBookingReturn() {
    handleBookingReturn();
    void document.getElementById('discovery-call')?.offsetHeight;

    function run() {
      scrollUntilCardVisible();
      history.replaceState(null, '', window.location.pathname + window.location.search + '#discovery-call');
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(run);
    } else {
      run();
    }
  }

  function start() {
    if (document.readyState === 'complete') {
      finalizeBookingReturn();
    } else {
      window.addEventListener('load', finalizeBookingReturn, { once: true });
    }
  }

  start();
}

function initHashNavigation() {
  function onIncludesLoaded() {
    configureBookingLinks();
    syncHeaderScrollOffset();
    initBookingReturn();
    if (window.location.hash && !isBookingReturn()) {
      scheduleHashScroll('auto');
    }
  }

  document.addEventListener('includes-loaded', onIncludesLoaded);

  if (!document.documentElement.hasAttribute('data-includes-pending')) {
    onIncludesLoaded();
  }

  if (document.readyState !== 'loading') {
    configureBookingLinks();
    if (isBookingReturn()) {
      handleBookingReturn();
    }
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      configureBookingLinks();
      if (isBookingReturn()) {
        handleBookingReturn();
      }
    });
  }

  window.addEventListener('hashchange', function () {
    if (isBookingReturn()) return;
    syncHeaderScrollOffset();
    scrollUntilHashAligned('smooth');
  });

  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href*="#"]');
    if (!link) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    const hash = url.hash;
    if (!hash || hash === '#') return;
    const target = document.querySelector(hash);
    if (!target) return;
    if (url.pathname !== window.location.pathname) return;
    e.preventDefault();
    if (window.location.hash !== hash) {
      history.pushState(null, '', hash);
    }
    syncHeaderScrollOffset();
    scrollUntilHashAligned('smooth');
  });
}

function initMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!mobileMenuBtn || !mobileMenu) return;

  function setMenuOpen(open) {
    mobileMenu.classList.toggle('mobile-menu--open', open);
    mobileMenuBtn.setAttribute('aria-expanded', String(open));
    mobileMenuBtn.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    document.body.style.overflow = open ? 'hidden' : '';
    const icon = mobileMenuBtn.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-bars', !open);
      icon.classList.toggle('fa-xmark', open);
    }
  }

  mobileMenuBtn.addEventListener('click', function () {
    setMenuOpen(!mobileMenu.classList.contains('mobile-menu--open'));
  });

  mobileMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      setMenuOpen(false);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileMenu.classList.contains('mobile-menu--open')) {
      setMenuOpen(false);
    }
  });

  document.addEventListener('click', function (e) {
    if (
      mobileMenu.classList.contains('mobile-menu--open') &&
      !mobileMenu.contains(e.target) &&
      !mobileMenuBtn.contains(e.target)
    ) {
      setMenuOpen(false);
    }
  });
}

document.addEventListener('includes-loaded', initMobileMenu);
initHashNavigation();
