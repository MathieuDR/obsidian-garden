// Left-sidebar "garden meta": a scale line (notes · links · tags) computed at build time,
// plus a "Random note" link that jumps to a random published note (client-side).
import { h } from "preact"

const CSS = `
.garden-meta { margin: 0.75rem 0; font-size: 0.85rem; }
.garden-meta .garden-stats { color: var(--gray); margin-bottom: 0.3rem; }
.garden-meta .garden-stats a { color: inherit; text-decoration: none; }
.garden-meta .garden-stats a:hover { color: var(--dark); text-decoration: underline; }
.garden-meta .random-note { color: var(--secondary); font-family: var(--codeFont); text-decoration: none; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35em; }
.garden-meta .random-note:hover { color: var(--tertiary); }
.garden-meta .random-note svg { width: 14px; height: 14px; }
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

// Lucide "dices" icon, inheriting the link colour via currentColor.
function dicesIcon() {
  return h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    },
    [
      h("rect", { width: "12", height: "12", x: "2", y: "10", rx: "2", ry: "2" }),
      h("path", { d: "m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6" }),
      h("path", { d: "M6 18h.01" }),
      h("path", { d: "M10 14h.01" }),
      h("path", { d: "M15 6h.01" }),
      h("path", { d: "M18 9h.01" }),
    ],
  )
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
    const stats = [`${fmt(notes.length)} notes · `]
    if (links > 0) stats.push(`${fmt(links)} links · `)
    // "N tags" is a subtle (grey, non-accented) link to the tag index.
    stats.push(h("a", { class: "stats-tags", href: "/tags" }, `${fmt(tagSet.size)} tags`))
    return h("div", { class: "garden-meta" }, [
      h("div", { class: "garden-stats" }, stats),
      h("a", { class: "random-note", href: "#" }, [dicesIcon(), h("span", null, "Random note")]),
    ])
  }
  Component.css = CSS
  Component.afterDOMLoaded = SCRIPT
  return Component
}

export { GardenMeta }
