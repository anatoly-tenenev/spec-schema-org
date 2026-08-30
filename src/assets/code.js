(() => {
  if (!navigator.clipboard) {
    return;
  }

  const blocks = document.querySelectorAll(".prose pre");
  const resetDelay = 1600;

  for (const block of blocks) {
    const code = block.querySelector("code");
    if (!code) {
      continue;
    }

    const target = block.closest("figure.code") || block;
    const wrapper = document.createElement("div");
    wrapper.className = "code-wrap";
    target.parentNode?.insertBefore(wrapper, target);
    wrapper.append(target);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-button";
    button.textContent = "Copy";
    button.setAttribute("aria-label", "Copy code to clipboard");

    let resetTimer = 0;
    const setLabel = (label, done) => {
      button.textContent = label;
      button.classList.toggle("copy-button--done", done);
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        button.textContent = "Copy";
        button.classList.remove("copy-button--done");
      }, resetDelay);
    };

    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.textContent || "");
        setLabel("Copied", true);
      } catch {
        setLabel("Failed", false);
      }
    });

    wrapper.append(button);
  }
})();
