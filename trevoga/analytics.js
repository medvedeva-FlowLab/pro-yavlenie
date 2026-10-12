(() => {
  // Set this to the Yandex Metrica counter ID after the counter is created.
  const counterId = 0;
  if (!counterId) return;

  const notice = document.querySelector('[data-analytics-notice]');
  const settings = document.querySelector('[data-analytics-settings]');
  const storageKey = 'site-analytics-consent';
  const sectionGoals = {
    program: 'anxiety_view_program',
    results: 'anxiety_view_results',
    about: 'anxiety_view_about',
    price: 'anxiety_view_price',
    contact: 'anxiety_view_contact',
  };
  let consent = '';
  let observing = false;

  try {
    consent = localStorage.getItem(storageKey) || '';
  } catch (_) {
    // The choice still works for the current page view.
  }

  const track = (goal) => {
    if (consent === 'accepted' && typeof window.ym === 'function') {
      window.ym(counterId, 'reachGoal', goal);
    }
  };

  const observeSections = () => {
    if (observing || !('IntersectionObserver' in window)) return;
    observing = true;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        track(sectionGoals[entry.target.id]);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -35% 0px', threshold: 0 });

    Object.keys(sectionGoals).forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  };

  const loadCounter = () => {
    if (typeof window.ym === 'function') return;
    window.ym = function () {
      (window.ym.a = window.ym.a || []).push(arguments);
    };
    window.ym.l = Date.now();

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://mc.yandex.ru/metrika/tag.js';
    document.head.appendChild(script);

    window.ym(counterId, 'init', {
      clickmap: false,
      trackLinks: false,
      accurateTrackBounce: true,
      webvisor: false,
    });
    observeSections();
  };

  const saveConsent = (value) => {
    const wasAccepted = consent === 'accepted';
    consent = value;
    try {
      localStorage.setItem(storageKey, value);
    } catch (_) {
      // Continue without persistent storage.
    }
    notice.hidden = true;
    if (value === 'accepted') loadCounter();
    if (value === 'declined' && wasAccepted) window.location.reload();
  };

  document.querySelectorAll('[data-open-lead]').forEach((button) => {
    button.addEventListener('click', () => track('anxiety_intro_click'));
  });
  document.querySelector('.consultation-alternative a')?.addEventListener('click', () => {
    track('anxiety_consultation_click');
  });

  settings.hidden = false;
  settings.addEventListener('click', () => { notice.hidden = false; });
  notice.querySelector('[data-analytics-accept]').addEventListener('click', () => saveConsent('accepted'));
  notice.querySelector('[data-analytics-decline]').addEventListener('click', () => saveConsent('declined'));

  if (consent === 'accepted') loadCounter();
  else if (!consent) notice.hidden = false;
})();
