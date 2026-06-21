(function () {
  const page = document.body.dataset.page || 'home';
  const isWorkshop = page === 'workshop';
  const indexPrefix = isWorkshop ? 'index.html' : '';

  document.documentElement.setAttribute('data-includes-pending', '');

  function navHref(section) {
    if (section === 'workshop') return 'workshop.html';
    const hash = '#' + section;
    return indexPrefix ? indexPrefix + hash : hash;
  }

  function configureNav() {
    document.querySelectorAll('[data-nav]').forEach(function (link) {
      const section = link.dataset.nav;
      link.href = navHref(section);

      if (section === 'workshop' && isWorkshop) {
        link.classList.add('nav-link--active', 'mobile-menu__link--active', 'active');
        link.setAttribute('aria-current', 'page');
      }
    });

    const logoLink = document.getElementById('site-logo-link');
    if (logoLink) {
      logoLink.href = isWorkshop ? 'index.html' : '#';
    }

    const ctaConfig = isWorkshop
      ? { href: '#apply', text: 'Apply for a Seat' }
      : { href: '#contact', text: 'Initiate Contact' };

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
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load ' + url);
    el.innerHTML = await res.text();
  }

  Promise.all([
    loadPartial('site-header', 'partials/header.html'),
    loadPartial('site-footer', 'partials/footer.html'),
  ])
    .then(function () {
      configureNav();
      document.documentElement.removeAttribute('data-includes-pending');
      document.dispatchEvent(new Event('includes-loaded'));
    })
    .catch(function (err) {
      console.error('Failed to load page partials:', err);
      document.documentElement.removeAttribute('data-includes-pending');
    });
})();
