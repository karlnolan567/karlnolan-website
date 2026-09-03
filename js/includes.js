(function () {
  const page = document.body.dataset.page || 'home';
  const isWorkshopsHub = page === 'workshops';
  const isWorkshopDetail = /^workshop-\d$/.test(page);
  const isAgenticWorkshop = page === 'agentic-impact-workshop';
  const isTraining = page === 'training';
  const isWhatWeAutomate = page === 'what-we-automate';
  const isWorkflowAssessment = page === 'workflow-assessment';
  const isScoping = page === 'scoping';
  const isAbout = page === 'about';
  const isPrivacy = page === 'privacy';
  const isAiEngineering = page === 'ai-engineering';
  const isCaseStudies = page === 'case-studies';
  const isPoSalesOrder = page === 'po-sales-order';
  const isSmartInbox = page === 'smart-inbox';
  const isDemos = page === 'demos' || page.indexOf('prototype') === 0;
  const isOffHome = isWorkshopsHub || isWorkshopDetail || isAgenticWorkshop || isTraining || isWhatWeAutomate || isWorkflowAssessment || isScoping || isAbout || isPrivacy || isAiEngineering || isCaseStudies || isPoSalesOrder || isSmartInbox || isDemos;
  const indexPrefix = isOffHome ? '/' : '';

  document.documentElement.setAttribute('data-includes-pending', '');

function bookingHref() {
  if (typeof SITE !== 'undefined' && SITE.bookingUrl) {
    return SITE.bookingUrl;
  }
  return '#discovery-call';
}

  function navHref(section) {
    if (section === 'workshops') return SITE.workshopHubUrl || 'workshops.html';
    if (section === 'workshop') return 'agentic-impact-workshop.html';
    if (section === 'training') return SITE.trainingUrl || 'training.html';
    if (section === 'what-we-automate') return SITE.whatWeAutomateUrl || 'what-we-automate.html';
    if (section === 'scoping') return SITE.scopingUrl || 'scoping.html';
    if (section === 'about') return SITE.aboutUrl || 'about.html';
    if (section === 'ai-engineering') return SITE.aiEngineeringUrl || 'ai-engineering.html';
    if (section === 'case-studies') return SITE.caseStudiesUrl || 'case-studies.html';
    if (section === 'po-sales-order') return SITE.poSalesOrderUrl || 'po-sales-order.html';
    if (section === 'smart-inbox') return SITE.smartInboxUrl || 'smart-inbox.html';
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

  function isLocalPreviewHost() {
    return /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  }

  function loadScript(src, onDone) {
    const script = document.createElement('script');
    script.src = src;
    if (onDone) {
      script.onload = onDone;
      script.onerror = onDone;
    }
    document.body.appendChild(script);
  }

  function startChatWidget() {
    if (!SITE.chatEmbedUrl) {
      return;
    }
    const version = encodeURIComponent(SITE.partialVersion || '1');
    loadScript('js/chat-embed.js?v=' + version);
  }

  function initChatbot() {
    if (isDemos) {
      return;
    }
    if (!isLocalPreviewHost()) {
      startChatWidget();
      return;
    }
    // Optional gitignored override can change SITE.chatEmbedUrl for local experiments.
    loadScript('js/site-config.local.js?v=' + encodeURIComponent(SITE.partialVersion || '1'), startChatWidget);
  }

  function configureNav() {
    document.querySelectorAll('[data-nav]').forEach(function (link) {
      const section = link.dataset.nav;
      link.href = navHref(section);

      if (section === 'workshops' && isOffHome && isWorkshopsHub) {
        link.classList.add('nav-link--active', 'mobile-menu__link--active', 'active');
        link.setAttribute('aria-current', 'page');
      }

      if (section === 'workshop' && isAgenticWorkshop) {
        link.classList.add('nav-link--active', 'mobile-menu__link--active', 'active');
        link.setAttribute('aria-current', 'page');
      }

      if (section === 'training' && isTraining) {
        link.classList.add('nav-link--active', 'mobile-menu__link--active', 'active');
        link.setAttribute('aria-current', 'page');
      }

      if (section === 'what-we-automate' && isWhatWeAutomate) {
        link.classList.add('nav-link--active', 'mobile-menu__link--active', 'active');
        link.setAttribute('aria-current', 'page');
      }

      if (section === 'scoping' && isScoping) {
        link.classList.add('nav-link--active', 'mobile-menu__link--active', 'active');
        link.setAttribute('aria-current', 'page');
      }

      if (section === 'about' && isAbout) {
        link.classList.add('nav-link--active', 'mobile-menu__link--active', 'active');
        link.setAttribute('aria-current', 'page');
      }

      if (section === 'ai-engineering' && isAiEngineering) {
        link.classList.add('nav-link--active', 'mobile-menu__link--active', 'active');
        link.setAttribute('aria-current', 'page');
      }

      if (section === 'case-studies' && isCaseStudies) {
        link.classList.add('nav-link--active', 'mobile-menu__link--active', 'active');
        link.setAttribute('aria-current', 'page');
      }

      if (section === 'po-sales-order' && isPoSalesOrder) {
        link.classList.add('nav-link--active', 'mobile-menu__link--active', 'active');
        link.setAttribute('aria-current', 'page');
      }

      if (section === 'smart-inbox' && isSmartInbox) {
        link.classList.add('nav-link--active', 'mobile-menu__link--active', 'active');
        link.setAttribute('aria-current', 'page');
      }
    });

    const logoLink = document.getElementById('site-logo-link');
    if (logoLink) {
      logoLink.href = isOffHome ? '/' : '#';
    }

    let ctaConfig;
    if (isAgenticWorkshop) {
      ctaConfig = { href: 'mailto:info@bespoke-ai.ie?subject=Workshop%20application%20%E2%80%94%20Cohort%201', text: 'Apply for a Seat' };
    } else if (isWorkshopDetail) {
      ctaConfig = { href: '#apply', text: 'Apply for a Seat' };
    } else if (isWorkshopsHub) {
      ctaConfig = { href: '#workshops-list', text: 'View Workshops' };
    } else if (isTraining) {
      ctaConfig = { href: 'mailto:info@bespoke-ai.ie?subject=Fundamentals%20of%20AI%20—%20enquiry', text: 'Enquire about training' };
    } else if (isWhatWeAutomate || isWorkflowAssessment || isScoping || isAbout || isPrivacy || isAiEngineering || isCaseStudies || isPoSalesOrder || isSmartInbox || isDemos) {
      ctaConfig = { href: '/#discovery-call', text: 'Get in Touch' };
    } else {
      ctaConfig = { href: '#discovery-call', text: 'Get in Touch' };
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
      initChatbot();
      document.documentElement.removeAttribute('data-includes-pending');
      document.dispatchEvent(new Event('includes-loaded'));
    })
    .catch(function (err) {
      console.error('Failed to load page partials:', err);
      document.documentElement.removeAttribute('data-includes-pending');
    });
})();
