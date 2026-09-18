(() => {
  "use strict";

  const data = window.PORTFOLIO_DATA;
  if (!data?.items?.length) return;

  const $ = (selector) => document.querySelector(selector);
  const gallery = $("#gallery");
  const filters = $("#filters");
  const search = $("#search");
  const resultCount = $("#result-count");
  const emptyState = $("#empty-state");
  const viewer = $("#viewer");
  const viewerGif = $("#viewer-gif");
  const viewerLoading = $("#viewer-loading");

  let activeCategory = "全部";
  let query = "";
  let visibleItems = [...data.items];
  let viewerIndex = 0;

  const pad = (number) => String(number).padStart(2, "0");
  const countFor = (category) => category === "全部"
    ? data.items.length
    : (data.categoryCounts[category] || 0);

  const searchable = (item) => [
    item.project,
    item.category,
    item.skeleton,
    item.animation,
    item.displayAnimation,
  ].join(" ").toLowerCase();

  function renderFilters() {
    filters.innerHTML = data.categories.map((category) => `
      <button
        class="filter-button${category === activeCategory ? " active" : ""}"
        type="button"
        data-category="${category}"
        aria-pressed="${category === activeCategory}"
      >${category}<span>${countFor(category)}</span></button>
    `).join("");
  }

  function updateVisibleItems() {
    visibleItems = data.items.filter((item) => {
      const categoryMatch = activeCategory === "全部" || item.category === activeCategory;
      const queryMatch = !query || searchable(item).includes(query);
      return categoryMatch && queryMatch;
    });
  }

  function renderGallery() {
    updateVisibleItems();
    resultCount.textContent = `${visibleItems.length} 个作品`;
    emptyState.hidden = visibleItems.length !== 0;
    gallery.hidden = visibleItems.length === 0;
    gallery.innerHTML = visibleItems.map((item) => {
      const originalIndex = data.items.findIndex((entry) => entry.id === item.id) + 1;
      return `
        <button class="work-card" type="button" data-id="${item.id}" aria-label="播放 ${item.project} ${item.displayAnimation}">
          <span class="card-art" data-index="${pad(originalIndex)}">
            <span class="card-tag">${item.category}</span>
            <img src="${item.poster}" alt="${item.project} ${item.displayAnimation} 预览" loading="lazy" decoding="async" draggable="false" />
          </span>
          <span class="card-meta">
            <h3>${item.displayAnimation}</h3>
            <time>${item.duration.toFixed(2)}s</time>
            <p>${item.project} · ${item.skeleton}</p>
          </span>
        </button>`;
    }).join("");
  }

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    renderFilters();
    renderGallery();
  });

  search.addEventListener("input", () => {
    query = search.value.trim().toLowerCase();
    renderGallery();
  });

  gallery.addEventListener("click", (event) => {
    const card = event.target.closest("[data-id]");
    if (!card) return;
    const index = visibleItems.findIndex((item) => item.id === card.dataset.id);
    openViewer(Math.max(0, index));
  });

  function fillViewer(item) {
    viewerGif.style.opacity = "0";
    viewerLoading.hidden = false;
    viewerGif.alt = `${item.project} ${item.displayAnimation}`;
    viewerGif.src = item.gif;
    $("#viewer-category").textContent = item.category.toUpperCase();
    $("#viewer-title").textContent = item.displayAnimation;
    $("#viewer-project").textContent = `${item.project} · ${item.skeleton} / ${item.animation}`;
    $("#viewer-duration").textContent = `${item.duration.toFixed(2)} 秒`;
    $("#viewer-frames").textContent = `${item.frames} 帧`;
    $("#viewer-dimensions").textContent = item.dimensions;
    $("#viewer-position").textContent = `${pad(viewerIndex + 1)} / ${pad(visibleItems.length)}`;
  }

  function openViewer(index) {
    viewerIndex = index;
    fillViewer(visibleItems[viewerIndex]);
    if (!viewer.open) viewer.showModal();
  }

  function closeViewer() {
    viewer.close();
    viewerGif.removeAttribute("src");
  }

  function moveViewer(step) {
    viewerIndex = (viewerIndex + step + visibleItems.length) % visibleItems.length;
    fillViewer(visibleItems[viewerIndex]);
  }

  viewerGif.addEventListener("load", () => {
    viewerLoading.hidden = true;
    viewerGif.style.opacity = "1";
  });
  $("#viewer-close").addEventListener("click", closeViewer);
  $("#viewer-prev").addEventListener("click", () => moveViewer(-1));
  $("#viewer-next").addEventListener("click", () => moveViewer(1));
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) closeViewer();
  });
  viewer.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeViewer();
  });
  document.addEventListener("keydown", (event) => {
    if (!viewer.open) return;
    if (event.key === "ArrowLeft") moveViewer(-1);
    if (event.key === "ArrowRight") moveViewer(1);
  });

  // A compact, continuously animated showcase without forcing all 111 GIFs to load.
  const featured = data.items
    .filter((item) => item.actualFrames > 1 && item.bytes < 2_500_000)
    .filter((item, index, array) => array.findIndex((entry) => entry.category === item.category) === index)
    .slice(0, 6);
  let featuredIndex = 0;
  const heroGif = $("#hero-gif");

  function showFeatured() {
    const item = featured[featuredIndex] || data.items[0];
    const originalIndex = data.items.findIndex((entry) => entry.id === item.id) + 1;
    heroGif.src = item.gif;
    $("#hero-index").textContent = `${pad(originalIndex)} / ${data.items.length}`;
    $("#hero-name").textContent = `${item.project} · ${item.displayAnimation}`;
  }

  $("#hero-next").addEventListener("click", () => {
    featuredIndex = (featuredIndex + 1) % featured.length;
    showFeatured();
  });

  // Public portfolio: remove direct download UI and discourage casual image dragging.
  document.addEventListener("dragstart", (event) => {
    if (event.target instanceof HTMLImageElement) event.preventDefault();
  });
  document.addEventListener("contextmenu", (event) => {
    if (event.target instanceof HTMLImageElement) event.preventDefault();
  });

  $("#stat-animations").textContent = data.stats.animations;
  $("#stat-projects").textContent = data.stats.projects;
  $("#stat-categories").textContent = data.stats.categories;
  renderFilters();
  renderGallery();
  showFeatured();
})();
