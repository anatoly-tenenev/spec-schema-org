(() => {
  const toc = document.getElementById("page-toc");
  const content = document.querySelector(".content--with-toc");

  if (!toc || !content) {
    return;
  }

  const headings = Array.from(content.querySelectorAll("h2, h3"));
  if (headings.length === 0) {
    const sidebar = document.querySelector(".toc-sidebar");
    if (sidebar) {
      sidebar.remove();
    }
    return;
  }

  const slugify = (value) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const idCount = new Map();
  const linksById = new Map();

  for (const heading of headings) {
    const text = heading.textContent?.trim();
    if (!text) {
      continue;
    }

    let id = heading.id || slugify(text);
    if (!id) {
      continue;
    }

    const seen = idCount.get(id) || 0;
    idCount.set(id, seen + 1);
    if (seen > 0) {
      id = `${id}-${seen + 1}`;
    }

    heading.id = id;

    const link = document.createElement("a");
    link.href = `#${id}`;
    link.textContent = text;
    link.className = heading.tagName === "H3" ? "toc-link toc-link--h3" : "toc-link";
    link.dataset.tocId = id;
    toc.append(link);
    linksById.set(id, link);
  }

  if (linksById.size === 0) {
    return;
  }

  let activeId = "";

  const setActiveLink = (id) => {
    if (!id || id === activeId) {
      return;
    }

    if (activeId) {
      const previous = linksById.get(activeId);
      if (previous) {
        previous.classList.remove("toc-link--active");
        previous.removeAttribute("aria-current");
      }
    }

    const current = linksById.get(id);
    if (!current) {
      return;
    }

    current.classList.add("toc-link--active");
    current.setAttribute("aria-current", "location");
    activeId = id;
  };

  const syncActiveLinkToScroll = () => {
    const offset = 140;
    let nextActiveId = headings[0]?.id || "";

    for (const heading of headings) {
      if (heading.getBoundingClientRect().top - offset <= 0) {
        nextActiveId = heading.id;
        continue;
      }

      break;
    }

    setActiveLink(nextActiveId);
  };

  let frameRequested = false;
  const requestScrollSync = () => {
    if (frameRequested) {
      return;
    }

    frameRequested = true;
    window.requestAnimationFrame(() => {
      syncActiveLinkToScroll();
      frameRequested = false;
    });
  };

  toc.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLAnchorElement)) {
      return;
    }

    const tocId = target.dataset.tocId;
    if (tocId) {
      setActiveLink(tocId);
    }
  });

  window.addEventListener("scroll", requestScrollSync, { passive: true });
  window.addEventListener("resize", requestScrollSync);
  window.addEventListener("hashchange", () => {
    const hashId = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (linksById.has(hashId)) {
      setActiveLink(hashId);
      return;
    }

    requestScrollSync();
  });

  const initialHashId = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  if (linksById.has(initialHashId)) {
    setActiveLink(initialHashId);
  } else {
    syncActiveLinkToScroll();
  }
})();
