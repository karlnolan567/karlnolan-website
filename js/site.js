function bookingHref() {
  if (typeof SITE !== 'undefined' && SITE.bookingUrl) {
    return SITE.bookingUrl;
  }
  return '#discovery-call';
}

function bookingScheduleHref() {
  if (typeof SITE !== 'undefined' && SITE.bookingScheduleUrl) {
    return SITE.bookingScheduleUrl;
  }
  return bookingHref();
}

function bookingEmbedHref() {
  if (typeof SITE !== 'undefined' && SITE.bookingEmbedUrl) {
    return SITE.bookingEmbedUrl;
  }
  var schedule = bookingScheduleHref();
  if (!schedule || schedule.charAt(0) === '#') return '';
  return schedule.indexOf('?') >= 0 ? schedule + '&gv=true' : schedule + '?gv=true';
}

function configureBookingLinks() {
  var href = bookingHref();
  if (document.body && document.body.getAttribute('data-page') === 'home') {
    href = '#discovery-call';
  }
  document.querySelectorAll('[data-booking-link]').forEach(function (el) {
    el.href = href;
  });
  var scheduleHref = bookingScheduleHref();
  var scheduleLink = document.getElementById('booking-schedule-link');
  if (scheduleLink && scheduleHref) {
    scheduleLink.href = scheduleHref;
  }
}

function initBookingEmbed() {
  var iframe = document.getElementById('discovery-booking-embed');
  var button = document.getElementById('load-booking-calendar');
  if (!iframe || !button) return;
  var src = bookingEmbedHref();
  if (!src) return;
  button.addEventListener('click', function () {
    if (typeof PrivacyControls === 'undefined' || !PrivacyControls.loadBookingEmbed(iframe, src)) {
      return;
    }
    iframe.removeAttribute('hidden');
    var placeholder = document.getElementById('booking-embed-consent');
    if (placeholder) placeholder.hidden = true;
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

function redirectIfPrivacyHash() {
  if (typeof PrivacyControls === 'undefined') return false;
  var privacyUrl = PrivacyControls.privacyPageUrlFromHash(window.location.hash);
  if (!privacyUrl) return false;
  window.location.replace(privacyUrl);
  return true;
}

function initHashNavigation() {
  if (redirectIfPrivacyHash()) {
    return;
  }

  function onIncludesLoaded() {
    configureBookingLinks();
    initBookingEmbed();
    syncHeaderScrollOffset();
    if (window.location.hash) {
      scheduleHashScroll('auto');
    }
  }

  document.addEventListener('includes-loaded', onIncludesLoaded);

  if (!document.documentElement.hasAttribute('data-includes-pending')) {
    onIncludesLoaded();
  }

  if (document.readyState !== 'loading') {
    configureBookingLinks();
    initBookingEmbed();
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      configureBookingLinks();
      initBookingEmbed();
    });
  }

  window.addEventListener('hashchange', function () {
    if (redirectIfPrivacyHash()) {
      return;
    }
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

function initImageLightbox() {
  const triggers = document.querySelectorAll('[data-lightbox]');
  if (!triggers.length) return;

  let dialog = document.getElementById('image-lightbox');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'image-lightbox';
    dialog.className = 'image-lightbox';
    dialog.innerHTML =
      '<div class="image-lightbox__panel">' +
      '<button type="button" class="image-lightbox__close" aria-label="Close full-size image">&times;</button>' +
      '<img class="image-lightbox__img" alt="">' +
      '</div>';
    document.body.appendChild(dialog);
  }

  const img = dialog.querySelector('.image-lightbox__img');
  const closeBtn = dialog.querySelector('.image-lightbox__close');

  function closeLightbox() {
    if (dialog.open) dialog.close();
  }

  triggers.forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      const href = trigger.getAttribute('href');
      if (!href || !img) return;
      const thumb = trigger.querySelector('img');
      img.src = href;
      img.alt = (thumb && thumb.getAttribute('alt')) || 'Full-size image';
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        window.open(href, '_blank', 'noopener');
      }
    });
  });

  closeBtn.addEventListener('click', closeLightbox);

  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) closeLightbox();
  });
}

document.addEventListener('includes-loaded', initMobileMenu);
document.addEventListener('DOMContentLoaded', initImageLightbox);
if (document.readyState !== 'loading') initImageLightbox();
initHashNavigation();
