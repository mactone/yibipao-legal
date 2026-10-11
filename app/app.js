(() => {
  "use strict";
  const site = window.YIBIPAO_SITE;
  if (!site) return;

  const statusLabels = {
    testing: "測試中",
    building: "開發中",
    planned: "規劃中",
  };
  const roadmapList = document.querySelector("#roadmap-list");
  const roadmapCount = document.querySelector("#roadmap-count");
  const create = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function renderRoadmap(filter = "all") {
    const items = site.roadmap.filter(
      (item) => filter === "all" || item.status === filter,
    );
    const fragment = document.createDocumentFragment();
    for (const item of items) {
      const article = create("article", "roadmap-item");
      article.dataset.status = item.status;
      const state = create(
        "span",
        "roadmap-state " + item.status,
        statusLabels[item.status],
      );
      const content = create("div");
      content.append(
        create("h3", "", item.title),
        create("p", "", item.description),
      );
      article.append(
        state,
        content,
        create("span", "roadmap-category", item.tag),
      );
      fragment.append(article);
    }
    roadmapList.replaceChildren(fragment);
    roadmapCount.textContent =
      String(items.length).padStart(2, "0") + " 個開發方向";
  }
  for (const button of document.querySelectorAll("[data-filter]")) {
    button.addEventListener("click", () => {
      for (const other of document.querySelectorAll("[data-filter]")) {
        const selected = other === button;
        other.classList.toggle("is-active", selected);
        other.setAttribute("aria-pressed", String(selected));
      }
      renderRoadmap(button.dataset.filter);
    });
  }
  renderRoadmap();

  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#main-nav");
  function setMenu(open) {
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute(
      "aria-label",
      open ? "關閉導覽選單" : "開啟導覽選單",
    );
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
  }
  menuButton.addEventListener("click", () =>
    setMenu(menuButton.getAttribute("aria-expanded") !== "true"),
  );
  for (const link of nav.querySelectorAll("a"))
    link.addEventListener("click", () => setMenu(false));
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menuButton.getAttribute("aria-expanded") === "true"
    ) {
      setMenu(false);
      menuButton.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-header")) setMenu(false);
  });
  // The menu is a disclosure, not a modal. Keep keyboard focus from moving
  // into content obscured by the open panel.
  document.addEventListener("focusin", (event) => {
    if (!event.target.closest(".site-header")) setMenu(false);
  });
  window
    .matchMedia("(min-width: 641px)")
    .addEventListener("change", (event) => {
      if (event.matches) setMenu(false);
    });

  const suggestionList = document.querySelector("#suggestion-list");
  const notice = document.querySelector("#vote-notice");
  const voteStatus = document.querySelector("#vote-status");
  const resetButton = document.querySelector("#reset-votes");
  const storageKey = "yibipao.website.preview.votes.v1";
  const knownIds = new Set(site.suggestions.map((item) => item.id));
  let votes = new Set();
  let storageAvailable = true;

  function parseVotes(raw) {
    try {
      const saved = JSON.parse(raw);
      if (!Array.isArray(saved)) return new Set();
      return new Set(
        saved.filter((id) => typeof id === "string" && knownIds.has(id)),
      );
    } catch {
      return new Set();
    }
  }
  if (site.voteMode === "local-preview") {
    try {
      votes = parseVotes(window.localStorage.getItem(storageKey));
    } catch {
      storageAvailable = false;
    }
    resetButton.hidden = false;
  }

  function renderNotice() {
    notice.replaceChildren(
      create("span", "notice-tag", "互動預覽"),
      create(
        "p",
        "",
        storageAvailable
          ? "這裡可以試投、取消。選擇只存在此瀏覽器，不會計入公開票數。"
          : "這裡可以試投、取消。瀏覽器不允許保存，選擇將在離開頁面後清除；不會計入公開票數。",
      ),
    );
  }

  function saveVotes() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([...votes]));
      storageAvailable = true;
    } catch {
      storageAvailable = false;
    }
    renderNotice();
  }

  function updateVoteButton(button, idea) {
    const active = votes.has(idea.id);
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute(
      "aria-label",
      (active ? "取消支持「" : "支持「") + idea.title + "」（示範投票）",
    );
    button.querySelector(".vote-arrow").textContent = active ? "✓" : "↑";
    button.querySelector(".vote-count").textContent = active ? "1" : "0";
    button.querySelector(".vote-label").textContent = active
      ? "已支持"
      : "支持";
  }

  function renderSuggestions() {
    const fragment = document.createDocumentFragment();
    for (const idea of site.suggestions) {
      const article = create("article", "suggestion-row");
      const content = create("div");
      const heading = create("div", "suggestion-title");
      // No user content is assigned to innerHTML.
      const graphic = create("div", "idea-graphic");
      graphic.setAttribute("aria-hidden", "true");
      const artPositions = { "apple-watch-app": [0,0], "same-route": [50,0], "collaborative-art": [100,0], garmin: [0,100], "street-atlas": [50,100], "crew-territory": [100,100] };
      const position = artPositions[idea.id];
      if (position) {
        graphic.classList.add("idea-art");
        graphic.style.backgroundPosition = position[0] + "% " + position[1] + "%";
      } else {
        graphic.classList.add("idea-art-fallback");
        graphic.textContent = "新玩法";
      }
      article.append(graphic);
      heading.append(
        create("h4", "", idea.title),
        create("span", "", idea.tag),
      );
      content.append(heading, create("p", "", idea.description));
      const button = create("button", "vote-button");
      button.type = "button";
      button.dataset.idea = idea.id;
      button.append(
        create("span", "vote-arrow"),
        create("span", "vote-count"),
        create("span", "vote-label"),
      );
      button.querySelector(".vote-arrow").setAttribute("aria-hidden", "true");
      button.disabled = site.voteMode !== "local-preview";
      updateVoteButton(button, idea);
      button.addEventListener("click", () => {
        if (votes.has(idea.id)) {
          votes.delete(idea.id);
          voteStatus.textContent = "已取消對「" + idea.title + "」的示範支持。";
        } else {
          votes.add(idea.id);
          voteStatus.textContent =
            "已支持「" + idea.title + "」！再次點擊即可取消。";
        }
        saveVotes();
        updateVoteButton(button, idea);
      });
      article.append(content, button);
      fragment.append(article);
    }
    suggestionList.replaceChildren(fragment);
  }

  resetButton.addEventListener("click", () => {
    votes.clear();
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      storageAvailable = false;
    }
    renderNotice();
    for (const idea of site.suggestions) {
      updateVoteButton(
        suggestionList.querySelector('[data-idea="' + idea.id + '"]'),
        idea,
      );
    }
    voteStatus.textContent = "已清除你的示範票，可以重新試投。";
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== storageKey && event.key !== null) return;
    votes = parseVotes(event.newValue);
    for (const idea of site.suggestions) {
      updateVoteButton(
        suggestionList.querySelector('[data-idea="' + idea.id + '"]'),
        idea,
      );
    }
    voteStatus.textContent = "已同步此瀏覽器其他分頁的示範選擇。";
  });

  if (site.voteMode === "local-preview") renderNotice();
  renderSuggestions();
  const previous = document.querySelector("#ideas-prev");
  const next = document.querySelector("#ideas-next");
  function updateRail() {
    previous.disabled = suggestionList.scrollLeft < 8;
    next.disabled = suggestionList.scrollLeft >= suggestionList.scrollWidth - suggestionList.clientWidth - 8;
  }
  function moveRail(direction) {
    const card = suggestionList.querySelector("article");
    const distance = card ? card.getBoundingClientRect().width + 20 : 280;
    suggestionList.scrollBy({left: direction * distance, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"});
  }
  previous.addEventListener("click", () => moveRail(-1));
  next.addEventListener("click", () => moveRail(1));
  suggestionList.addEventListener("scroll", updateRail, {passive:true});
  new ResizeObserver(updateRail).observe(suggestionList);
  updateRail();
})();
