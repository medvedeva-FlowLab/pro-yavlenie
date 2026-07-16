(function () {
  const root = document.querySelector("[data-stories-root]");
  const config = window.siteConfig || {};
  const params = new URLSearchParams(window.location.search);
  const selectedStory = params.get("story");

  const requests = (config.requests || []).slice(0, 8);
  const heroImage = config.media?.heroImage || "./assets/photos/hero-anastasia-cutout-v4.png";

  const stories = [
    {
      key: "hero",
      label: "Hero photo",
      render: () => `
        <section class="story hero-photo-story">
          <div class="story-scribble-top" aria-hidden="true"></div>
          <div class="story-shell is-plain">
            <div class="photo-cloud" aria-hidden="true"></div>
            <div class="photo-shadow" aria-hidden="true"></div>
            <img src="${heroImage}" alt="Настя Медведева" />
          </div>
        </section>
      `,
    },
    {
      key: "background",
      label: "Background",
      render: () => `
        <section class="story story-abstract">
          <div class="story-shell is-plain">
            <div class="abstract-blob" aria-hidden="true"></div>
            <div class="abstract-oval" aria-hidden="true"></div>
            <div class="abstract-wave top" aria-hidden="true"></div>
            <div class="abstract-wave bottom" aria-hidden="true"></div>
            <div class="abstract-arc left" aria-hidden="true"></div>
            <div class="abstract-arc right" aria-hidden="true"></div>
          </div>
        </section>
      `,
    },
    {
      key: "requests",
      label: "Requests",
      render: () => `
        <section class="story requests-story">
          <div class="story-shell">
            <p class="story-eyebrow">Запросы</p>
            <h1 class="story-title-medium">С какими мыслями часто приходят</h1>
            <div class="story-chip-list">
              ${requests
                .map((item) => `<p class="story-chip">${item}</p>`)
                .join("")}
            </div>
            <p class="story-text-small">
              Если сформулировать словами пока не получается — это тоже нормально.
            </p>
          </div>
        </section>
      `,
    },
    {
      key: "format",
      label: "Format",
      render: () => `
        <section class="story format-story">
          <div class="story-shell">
            <p class="story-eyebrow">Формат работы</p>
            <h1 class="story-title">Онлайн,<br />без спешки</h1>
            <div class="story-cards">
              <article class="story-card">
                <strong>Длительность сессии</strong>
                <span class="story-value">60 минут</span>
              </article>
              <article class="story-card">
                <strong>Стоимость</strong>
                <span class="story-value">3 000 руб.</span>
              </article>
              <article class="story-card">
                <strong>Ритм встреч</strong>
                <span>Раз в неделю или раз в две недели — так, как вам подходит.</span>
              </article>
            </div>
          </div>
        </section>
      `,
    },
    {
      key: "education",
      label: "Education",
      render: () => `
        <section class="story education-story">
          <div class="story-shell">
            <p class="story-eyebrow">Образование</p>
            <h1 class="story-title-medium">Дипломы и обучение</h1>
            <div class="diploma-row">
              <figure class="diploma-mini">
                <img src="./assets/diplomas/higher-education-preview.jpg" alt="Высшее образование" />
                <figcaption>Высшее образование</figcaption>
              </figure>
              <figure class="diploma-mini">
                <img src="./assets/diplomas/qualification-diploma-preview.jpg" alt="Диплом психолога-консультанта" />
                <figcaption>Психолог-консультант</figcaption>
              </figure>
            </div>
            <p class="story-text-small">
              Продолжаю обучение, прохожу супервизию и дополнительно учусь сексологии.
            </p>
          </div>
        </section>
      `,
    },
  ];

  const renderOverview = () => {
    root.classList.add("is-overview");
    root.innerHTML = stories
      .map(
        (story) => `
          <section class="story-frame">
            <span class="story-label">${story.label}</span>
            ${story.render()}
          </section>
        `
      )
      .join("");
  };

  const renderSingle = (story) => {
    root.classList.add("is-single");
    root.innerHTML = story.render();
    document.body.dataset.story = story.key;
  };

  const activeStory = stories.find((story) => story.key === selectedStory);

  if (activeStory) {
    renderSingle(activeStory);
  } else {
    renderOverview();
  }
})();
