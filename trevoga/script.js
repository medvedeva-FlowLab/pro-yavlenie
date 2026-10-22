(() => {
  const dialog = document.getElementById('leadDialog');
  const form = document.getElementById('leadForm');
  const status = document.getElementById('leadStatus');
  const submit = form.querySelector('[type="submit"]');
  const tabs = [...dialog.querySelectorAll('[data-contact-tab]')];
  const panels = {
    write: document.getElementById('contactPanelWrite'),
    form,
  };
  const contactMethod = document.getElementById('leadContactMethod');
  const telegramField = document.getElementById('leadTelegramField');
  const telegramInput = document.getElementById('leadTelegram');
  const greeting = 'Здравствуйте, Настя! Мне хотелось бы познакомиться и узнать, подойдёт ли мне программа про тревогу 🌿';
  const telegramUrl = `https://t.me/aanastasia_me?text=${encodeURIComponent(greeting)}`;
  const whatsappUrl = `https://wa.me/79858852191?text=${encodeURIComponent(greeting)}`;
  dialog.querySelector('[data-messenger="telegram"]').href = telegramUrl;
  dialog.querySelector('[data-messenger="whatsapp"]').href = whatsappUrl;
  let returnFocus = null;

  function selectTab(which, focus = false) {
    for (const tab of tabs) {
      const selected = tab.dataset.contactTab === which;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    }
    panels.write.hidden = which !== 'write';
    panels.form.hidden = which !== 'form';
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab.dataset.contactTab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      selectTab(next.dataset.contactTab, true);
    });
  });

  document.querySelectorAll('[data-open-lead]').forEach((button) => {
    button.addEventListener('click', () => {
      returnFocus = button;
      status.textContent = '';
      delete status.dataset.state;
      selectTab('write');
      dialog.showModal();
      tabs[0].focus();
    });
  });

  dialog.querySelector('[data-close-lead]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => returnFocus?.focus());

  contactMethod.addEventListener('change', () => {
    const isTelegram = contactMethod.value === 'telegram';
    telegramField.hidden = !isTelegram;
    telegramInput.required = isTelegram;
    if (!isTelegram) telegramInput.value = '';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity() || form.elements.company.value) return;

    const endpoint = form.dataset.endpoint?.trim();
    if (!endpoint) {
      status.textContent = 'Приём заявок через форму пока подключается. Сейчас можно написать мне в мессенджер.';
      status.dataset.state = 'error';
      return;
    }

    const payload = {
      name: form.elements.name.value.trim(),
      surname: form.elements.surname.value.trim(),
      phone: form.elements.phone.value.trim(),
      contactMethod: form.elements.contactMethod.value,
      telegram: form.elements.telegram.value.trim(),
      message: form.elements.message.value.trim(),
      consent: form.elements.consent.checked,
      company: form.elements.company.value,
      source: 'trevoga',
    };

    submit.disabled = true;
    status.textContent = 'Отправляем заявку…';
    delete status.dataset.state;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      let response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      status.textContent = 'Спасибо, заявка пришла! Я свяжусь с вами, чтобы договориться о времени.';
      status.dataset.state = 'success';
      document.dispatchEvent(new Event('anxiety:leadSent'));
      form.reset();
      telegramField.hidden = true;
      telegramInput.required = false;
    } catch {
      status.textContent = 'Не получилось отправить заявку. Попробуйте ещё раз или напишите мне в мессенджер.';
      status.dataset.state = 'error';
    } finally {
      submit.disabled = false;
    }
  });
})();
