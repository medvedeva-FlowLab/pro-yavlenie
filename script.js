(function () {
  const config = window.siteConfig;
  const body = document.body;
  const modal = document.querySelector("[data-modal]");
  const imageViewer = document.querySelector("[data-image-viewer]");
  const bookingForm = document.querySelector("[data-booking-form]");
  const formPanels = document.querySelectorAll("[data-form-state]");
  const viewerImage = document.querySelector("[data-viewer-image]");

  const setText = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) {
      node.textContent = value;
    }
  };

  const setMarkup = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) {
      node.innerHTML = value;
    }
  };

  const normalizeBlockItem = (item) => {
    if (typeof item === "string") {
      return { title: item, text: "" };
    }

    return {
      title: item?.title || "",
      text: item?.text || "",
    };
  };

  const createImageMarkup = (src, alt) => {
    if (!src) {
      return "";
    }

    return `<img src="${src}" alt="${alt || ""}" />`;
  };

  const hydrateMediaFrame = (element, src, alt) => {
    if (!element) {
      return;
    }

    element.innerHTML = createImageMarkup(src, alt);
    element.classList.toggle("is-placeholder", !src);
  };

  const renderRequests = () => {
    const list = document.querySelector("[data-request-list]");
    if (!list) {
      return;
    }

    list.innerHTML = config.requests
      .map((item) => `<article class="chip">${item}</article>`)
      .join("");
  };

  const renderApproaches = () => {
    const list = document.querySelector("[data-approach-list]");
    if (!list) {
      return;
    }

    list.innerHTML = config.approaches
      .map(
        (item) => {
          const normalized = normalizeBlockItem(item);

          return `
          <article class="card">
            <h3>${normalized.title}</h3>
            <p>${normalized.text}</p>
          </article>
        `;
        }
      )
      .join("");
  };

  const renderValues = () => {
    const list = document.querySelector("[data-values-list]");
    if (!list) {
      return;
    }

    list.innerHTML = config.values
      .map(
        (item) => {
          const normalized = normalizeBlockItem(item);

          return `
          <article class="value-item">
            <h3>${normalized.title}</h3>
            <p>${normalized.text}</p>
          </article>
        `;
        }
      )
      .join("");
  };

  const renderProcess = () => {
    const list = document.querySelector("[data-process-list]");
    if (!list) {
      return;
    }

    list.innerHTML = config.process
      .map(
        (item, index) => {
          const normalized = normalizeBlockItem(item);

          return `
          <article class="step">
            <span class="step-index">${index + 1}</span>
            <h3>${normalized.title}</h3>
            <p>${normalized.text}</p>
          </article>
        `;
        }
      )
      .join("");
  };

  const renderEducation = () => {
    const list = document.querySelector("[data-education-list]");
    if (!list) {
      return;
    }

    list.innerHTML = config.media.diplomas
      .map(
        (item, index) => `
          <article class="education-card">
            <button
              class="education-preview education-preview-button ${item.image ? "" : "is-placeholder"}"
              type="button"
              data-open-diploma="${index}"
              ${item.image ? "" : "disabled"}
              aria-label="${item.alt || item.title}"
            >
              ${item.image ? createImageMarkup(item.image, item.alt) : ""}
            </button>
            <div class="education-copy">
              <div class="education-title">${item.title}</div>
              <button
                class="link-button"
                type="button"
                data-open-diploma="${index}"
                ${item.image ? "" : "disabled"}
              >
                Открыть диплом
              </button>
            </div>
          </article>
        `
      )
      .join("");
  };

  const renderGallery = () => {
    const list = document.querySelector("[data-gallery-list]");
    if (!list) {
      return;
    }

    list.innerHTML = config.media.gallery
      .map(
        (item) => `
          <article class="gallery-item ${item.size || ""}">
            <div
              class="media-frame ${item.image ? "" : "is-placeholder"} ${item.fit === "contain" ? "is-contain" : ""}"
              data-caption="${item.title}"
              data-placeholder="${item.title}"
            >
              ${createImageMarkup(item.image, item.alt)}
            </div>
          </article>
        `
      )
      .join("");
  };

  const openModal = () => {
    setFormState("form");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    body.classList.add("modal-open");
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    body.classList.remove("modal-open");
    setFormState("form");
  };

  const openViewer = (src, alt) => {
    if (!src || !viewerImage) {
      return;
    }

    viewerImage.src = src;
    viewerImage.alt = alt || "";
    imageViewer.classList.add("is-open");
    imageViewer.setAttribute("aria-hidden", "false");
    body.classList.add("modal-open");
  };

  const closeViewer = () => {
    imageViewer.classList.remove("is-open");
    imageViewer.setAttribute("aria-hidden", "true");
    viewerImage.removeAttribute("src");
    viewerImage.alt = "";
    body.classList.remove("modal-open");
  };

  const setFormState = (state) => {
    formPanels.forEach((panel) => {
      const shouldShow = panel.dataset.formState === state;
      panel.hidden = !shouldShow;
    });
  };

  const getBookingUrl = () => {
    const directLink = (config.contacts.bookingLink || "").trim();
    if (directLink) {
      return directLink;
    }

    const telegram = (config.contacts.telegram || "").trim();
    if (!telegram) {
      return "";
    }

    if (/^https?:\/\//i.test(telegram)) {
      return telegram;
    }

    if (telegram.startsWith("@")) {
      return `https://t.me/${telegram.slice(1)}`;
    }

    return `https://t.me/${telegram}`;
  };

  const openBooking = () => {
    const bookingUrl = getBookingUrl();

    if (bookingUrl) {
      window.open(bookingUrl, "_blank", "noopener,noreferrer");
      return;
    }

    openModal();
  };

  const submitToIntegrations = async (payload) => {
    const endpoints = [
      config.integrations.emailEndpoint,
      config.integrations.telegramBotEndpoint,
    ].filter(Boolean);

    if (!endpoints.length) {
      console.info("Booking payload", payload);
      return;
    }

    await Promise.all(
      endpoints.map((endpoint) =>
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then((response) => {
          if (!response.ok) {
            throw new Error(`Integration request failed: ${response.status}`);
          }
        })
      )
    );
  };

  const getContactHint = () => {
    const details = [
      config.contacts.telegram ? `Telegram: ${config.contacts.telegram}` : "",
      config.contacts.phone ? `Телефон: ${config.contacts.phone}` : "",
      config.contacts.email ? `Email: ${config.contacts.email}` : "",
    ].filter(Boolean);

    if (!details.length) {
      return config.contacts.hint;
    }

    return `${details.join(" · ")}. ${config.contacts.hint}`;
  };

  const setupEvents = () => {
    document.querySelectorAll("[data-open-modal]").forEach((button) => {
      button.addEventListener("click", openBooking);
    });

    document.querySelectorAll("[data-close-modal]").forEach((button) => {
      button.addEventListener("click", closeModal);
    });

    document.querySelectorAll("[data-close-viewer]").forEach((button) => {
      button.addEventListener("click", closeViewer);
    });

    document.addEventListener("click", (event) => {
      const diplomaButton = event.target.closest("[data-open-diploma]");
      if (diplomaButton) {
        const item = config.media.diplomas[Number(diplomaButton.dataset.openDiploma)];
        openViewer(item.image, item.alt);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeModal();
        closeViewer();
      }
    });

    bookingForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitButton = bookingForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = "Отправляем...";

      const formData = new FormData(bookingForm);
      const payload = {
        name: formData.get("name"),
        contact: formData.get("contact"),
        request: formData.get("request"),
        sentAt: new Date().toISOString(),
      };

      try {
        await submitToIntegrations(payload);
        bookingForm.reset();
        setFormState("success");
      } catch (error) {
        console.error(error);
        window.alert(
          "Не удалось отправить заявку. Проверьте настройки интеграции в config.js."
        );
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Отправить заявку";
      }
    });
  };

  const setupReveal = () => {
    const elements = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );

    elements.forEach((element) => observer.observe(element));
  };

  const init = () => {
    setText("[data-therapist-name]", config.therapist.name);
    setText("[data-therapist-role]", config.therapist.role);
    setMarkup("[data-price-label]", config.pricing.label);
    setText("[data-contact-hint]", getContactHint());

    const heroFrame = document.querySelector('[data-media-key="heroImage"]');
    if (heroFrame) {
      heroFrame.classList.toggle(
        "is-cutout",
        config.media.heroImageStyle === "cutout"
      );
    }

    hydrateMediaFrame(heroFrame, config.media.heroImage, config.therapist.name);

    renderRequests();
    renderApproaches();
    renderValues();
    renderProcess();
    renderEducation();
    renderGallery();
    setupEvents();
    setupReveal();
    setFormState("form");
  };

  init();
})();
