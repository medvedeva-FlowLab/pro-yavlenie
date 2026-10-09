(() => {
  const dialog = document.getElementById('leadDialog');
  const form = document.getElementById('leadForm');
  const status = document.getElementById('leadStatus');
  const submit = form?.querySelector('[type="submit"]');
  const nameInput = document.getElementById('leadName');
  let returnFocus = null;

  document.querySelectorAll('[data-open-lead]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!form?.dataset.endpoint?.trim()) {
        window.open('https://t.me/aanastasia_me', '_blank', 'noopener,noreferrer');
        return;
      }
      returnFocus = button;
      status.textContent = '';
      delete status.dataset.state;
      dialog.showModal();
      nameInput.focus();
    });
  });

  dialog.querySelector('[data-close-lead]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => returnFocus?.focus());

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (form.elements.company.value) return;

    const endpoint = form.dataset.endpoint?.trim();
    if (!endpoint) {
      status.innerHTML = 'Запись через сайт скоро заработает. Пока можно <a href="https://t.me/aanastasia_me" target="_blank" rel="noopener noreferrer">написать мне в Telegram</a>.';
      status.dataset.state = 'error';
      return;
    }

    const payload = {
      name: form.elements.name.value.trim(),
      contact: form.elements.contact.value.trim(),
      message: form.elements.message.value.trim(),
      consent: form.elements.consent.checked,
      company: form.elements.company.value,
      source: 'trevoga',
    };
    if (!payload.name || !payload.contact || !payload.consent) return;

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
      status.textContent = 'Спасибо! Заявка отправлена. Я напишу вам, чтобы договориться о времени.';
      status.dataset.state = 'success';
      form.reset();
    } catch (error) {
      status.innerHTML = 'Заявка не отправилась. Попробуйте ещё раз или <a href="https://t.me/aanastasia_me" target="_blank" rel="noopener noreferrer">напишите мне в Telegram</a>.';
      status.dataset.state = 'error';
    } finally {
      submit.disabled = false;
    }
  });
})();
