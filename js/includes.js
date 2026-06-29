(function () {
  const page = document.body.dataset.page || 'home';
  const isWorkshopsHub = page === 'workshops';
  const isWorkshopDetail = /^workshop-\d$/.test(page);
  const isWhatWeAutomate = page === 'what-we-automate';
  const isOffHome = isWorkshopsHub || isWorkshopDetail || isWhatWeAutomate;
  const indexPrefix = isOffHome ? 'index.html' : '';

  document.documentElement.setAttribute('data-includes-pending', '');

  function navHref(section) {
    if (section === 'workshops') return SITE.workshopHubUrl || 'workshops.html';
    if (section === 'what-we-automate') return SITE.whatWeAutomateUrl || 'what-we-automate.html';
    if (section === 'assessment') return SITE.assessmentUrl;
    const hash = '#' + section;
    return indexPrefix ? indexPrefix + hash : hash;
  }

  function configureWorkshopVisibility() {
    const announce = document.getElementById('workshop-announce');

    if (SITE.showWorkshop) {
      document.querySelectorAll('[data-nav="workshops"]').forEach(function (link) {
        link.classList.remove('hidden');
      });
      if (announce) announce.classList.remove('hidden');
      return;
    }

    document.querySelectorAll('[data-nav="workshops"]').forEach(function (link) {
      link.classList.add('hidden');
    });
    if (announce) announce.classList.add('hidden');
  }

  function reorderNavLinks(container) {
    if (!container || !SITE.navOrder) return;

    SITE.navOrder.forEach(function (section) {
      const link = container.querySelector('[data-nav="' + section + '"]');
      if (link) container.appendChild(link);
    });
  }

  function configureNavOrder() {
    const headerNav = document.querySelector('.nav');
    const mobileMenu = document.getElementById('mobile-menu');
    const footerNav = document.querySelector('.footer-nav');

    reorderNavLinks(headerNav);
    if (mobileMenu) {
      const cta = document.getElementById('mobile-menu-cta');
      SITE.navOrder.forEach(function (section) {
        const link = mobileMenu.querySelector('[data-nav="' + section + '"]');
        if (link) mobileMenu.insertBefore(link, cta || null);
      });
    }
    reorderNavLinks(footerNav);
  }

  function configurePrivacy() {
    const privacyLink = document.getElementById('privacy-email');
    if (privacyLink && SITE.privacyEmail) {
      privacyLink.href = 'mailto:' + SITE.privacyEmail;
      privacyLink.textContent = SITE.privacyEmail;
    }
  }

  function configureNav() {
    document.querySelectorAll('[data-nav]').forEach(function (link) {
      const section = link.dataset.nav;
      link.href = navHref(section);

      if (section === 'workshops' && isOffHome && isWorkshopsHub) {
        link.classList.add('nav-link--active', 'mobile-menu__link--active', 'active');
        link.setAttribute('aria-current', 'page');
      }

      if (section === 'what-we-automate' && isWhatWeAutomate) {
        link.classList.add('nav-link--active', 'mobile-menu__link--active', 'active');
        link.setAttribute('aria-current', 'page');
      }
    });

    const logoLink = document.getElementById('site-logo-link');
    if (logoLink) {
      logoLink.href = isOffHome ? 'index.html' : '#';
    }

    let ctaConfig;
    if (isWorkshopDetail) {
      ctaConfig = { href: '#apply', text: 'Apply for a Seat' };
    } else if (isWorkshopsHub) {
      ctaConfig = { href: '#workshops-list', text: 'View Workshops' };
    } else if (isWhatWeAutomate) {
      ctaConfig = { href: 'index.html#discovery-call', text: 'Book a Call' };
    } else {
      ctaConfig = { href: '#discovery-call', text: 'Book a Call' };
    }

    ['header-cta', 'mobile-menu-cta'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) {
        el.href = ctaConfig.href;
        el.textContent = ctaConfig.text;
      }
    });
  }

  async function loadPartial(id, url) {
    const el = document.getElementById(id);
    if (!el) return;
    const versionedUrl = url + (url.indexOf('?') === -1 ? '?' : '&') + 'v=' + encodeURIComponent(SITE.partialVersion || '1');
    const res = await fetch(versionedUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load ' + url);
    el.innerHTML = await res.text();
  }

  Promise.all([
    loadPartial('site-header', 'partials/header.html'),
    loadPartial('site-footer', 'partials/footer.html'),
  ])
    .then(function () {
      configureNavOrder();
      configureNav();
      configurePrivacy();
      configureWorkshopVisibility();
      document.documentElement.removeAttribute('data-includes-pending');
      document.dispatchEvent(new Event('includes-loaded'));
    })
    .catch(function (err) {
      console.error('Failed to load page partials:', err);
      document.documentElement.removeAttribute('data-includes-pending');
    });
})();
