// Left-sidebar "garden meta": a scale line (notes · links · tags) computed at build time,
// plus a "Random note" link that jumps to a random published note (client-side).
import { h } from "preact"

const CSS = `
.garden-meta { margin: 0.75rem 0; font-size: 0.85rem; }
.garden-meta .garden-stats { color: var(--gray); margin-bottom: 0.3rem; }
.garden-meta .random-note { color: var(--secondary); font-family: var(--codeFont); text-decoration: none; cursor: pointer; }
.garden-meta .random-note:hover { color: var(--tertiary); }
`

// fetchData is the global content-index promise Quartz exposes (used by search/explorer).
const SCRIPT = `
(function () {
  function isNote(s) {
    return s && s !== "index" && s !== "timeline" && s !== "recent" && s !== "tags" &&
      s.indexOf("tags/") !== 0 && s.slice(-6) !== "/index";
  }
  function wire() {
    document.querySelectorAll("a.random-note").forEach(function (btn) {
      if (btn.dataset.wired) return;
      btn.dataset.wired = "1";
      btn.addEventListener("click", async function (e) {
        e.preventDefault();
        try {
          var data = await fetchData;
          var slugs = Object.keys(data).filter(isNote);
          if (!slugs.length) return;
          var pick = slugs[Math.floor(Math.random() * slugs.length)];
          window.location.href = "/" + pick;
        } catch (err) {}
      });
    });
  }
  document.addEventListener("nav", wire);
  wire();
})();
`

function fmt(n) {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n)
}

const GardenMeta = (opts) => {
  const Component = ({ allFiles }) => {
    const notes = (allFiles || []).filter(
      (f) =>
        f &&
        f.slug &&
        f.slug !== "index" &&
        f.slug !== "timeline" &&
        f.slug !== "recent" &&
        f.slug !== "tags" &&
        !String(f.slug).startsWith("tags/") &&
        !String(f.slug).endsWith("/index"),
    )
    const tagSet = new Set()
    let links = 0
    for (const f of notes) {
      const tags = f.frontmatter && Array.isArray(f.frontmatter.tags) ? f.frontmatter.tags : []
      for (const t of tags) tagSet.add(t)
      if (Array.isArray(f.links)) links += f.links.length
    }
    const parts = [`${fmt(notes.length)} notes`]
    if (links > 0) parts.push(`${fmt(links)} links`)
    parts.push(`${fmt(tagSet.size)} tags`)
    return h("div", { class: "garden-meta" }, [
      h("div", { class: "garden-stats" }, parts.join(" · ")),
      h("a", { class: "random-note", href: "#" }, "🎲 Random note"),
    ])
  }
  Component.css = CSS
  Component.afterDOMLoaded = SCRIPT
  return Component
}

export { GardenMeta }
