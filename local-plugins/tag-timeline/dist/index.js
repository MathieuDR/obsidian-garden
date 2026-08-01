// Override pageType: render TAG pages as the timeline "leaf" view (v4 behaviour),
// filtered to the notes carrying that tag. priority 20 wins over tag-page (10).
// The tag index (/tags) shows all tagged notes.
import { h } from "preact"

const CSS = `
.timeline { width: 100%; margin: 2rem 0; }
.timeline-container { position: relative; z-index: 0; max-width: 100%; margin: 0 auto; }
.timeline-line { position: absolute; left: 50%; top: 0; bottom: 0; width: 4px; background: var(--lightgray); transform: translateX(-50%); }
.timeline-event { display: grid; grid-template-columns: 1fr; gap: 0.5rem; position: relative; width: calc(50% - 2rem); margin: 2rem 0; }
.timeline-event.left { margin-right: auto; padding-right: 2rem; }
.timeline-event.right { margin-left: auto; padding-left: 2rem; }
.timeline-connector { position: absolute; display: flex; align-items: center; top: 1.5rem; width: 2rem; }
.timeline-event.left .timeline-connector { right: -8px; justify-content: flex-end; }
.timeline-event.right .timeline-connector { left: -7px; justify-content: flex-start; }
.timeline-dot { width: 16px; height: 16px; background: var(--secondary); border-radius: 50%; z-index: 2; }
.timeline-line-to-content { position: absolute; height: 2px; background: var(--lightgray); width: 100%; }
.timeline-metadata { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.25rem; color: var(--gray); gap: 1rem; }
.timeline-event.right .timeline-metadata { flex-direction: row; }
.timeline-event.left .timeline-metadata { flex-direction: row-reverse; }
.timeline-type-date { display: flex; flex-direction: column; }
.timeline-event.right .timeline-type-date { align-items: flex-start; }
.timeline-event.left .timeline-type-date { align-items: flex-end; }
.timeline-type { font-size: 0.9em; font-weight: 600; margin-bottom: 0.2rem; }
.timeline-date { font-size: 0.85em; }
.timeline-folder-desktop { font-size: 0.9em; color: var(--gray); align-self: flex-end; }
.timeline-content { background: var(--lightgray); border: 1px solid var(--gray); border-radius: 8px; padding: 1rem; }
.timeline-content .tags { margin: 0.5rem 0 0; }
.timeline-header { margin-bottom: 0.5rem; }
a.timeline-title.internal { font-size: 1.15em; background-color: unset; font-weight: 600; color: var(--secondary); text-decoration: none; }
a.timeline-title.internal:hover { text-decoration: underline; }
@media (max-width: 1200px) {
  .timeline-container { padding-left: 2rem; padding-right: 1rem; }
  .timeline-line { left: 2rem; }
  .timeline-event { width: calc(100% - 2rem); margin-left: auto !important; padding-left: 2rem !important; padding-right: 0 !important; }
  .timeline-connector { left: 0 !important; right: auto !important; justify-content: unset !important; }
  .timeline-dot { margin-left: -8px; }
  .timeline-type-date { align-items: flex-start !important; }
  .timeline-content { max-width: 90%; }
  .timeline-event.left .timeline-metadata { flex-direction: row; }
  .timeline-folder-desktop { display: none; }
}
`

function fmtDate(d, locale) {
  try { return new Date(d).toLocaleDateString(locale ?? "en-GB", { year: "numeric", month: "short", day: "numeric" }) } catch { return "" }
}
function isRealNote(f) {
  return f && f.slug && f.slug !== "timeline" && f.slug !== "recent" && !String(f.slug).endsWith("/index")
}
function noteBase(f) {
  return {
    slug: f.slug,
    title: (f.frontmatter && f.frontmatter.title) || f.slug,
    folder: String(f.slug).split("/").slice(0, -1).join("/"),
    tags: (f.frontmatter && Array.isArray(f.frontmatter.tags)) ? f.frontmatter.tags : [],
  }
}
function renderEvent(e, i, locale) {
  return h("div", { class: `timeline-event ${i % 2 === 0 ? "left" : "right"}`, key: `${e.slug}-${i}` }, [
    h("div", { class: "timeline-connector" }, [h("div", { class: "timeline-dot" }), h("div", { class: "timeline-line-to-content" })]),
    h("div", { class: "timeline-metadata" }, [
      h("div", { class: "timeline-type-date" }, [
        h("span", { class: "timeline-type" }, "Created"),
        h("span", { class: "timeline-date" }, fmtDate(e.date, locale)),
      ]),
      e.folder ? h("div", { class: "timeline-folder-desktop" }, e.folder) : null,
    ]),
    h("div", { class: "timeline-content" }, [
      h("div", { class: "timeline-header" }, h("a", { href: "/" + e.slug, class: "internal timeline-title" }, e.title)),
      e.tags.length > 0
        ? h("ul", { class: "tags" }, e.tags.map((t) => h("li", { key: t }, h("a", { href: "/tags/" + t, class: "internal tag-link" }, t))))
        : null,
    ]),
  ])
}

const TagTimeline = (opts) => ({
  name: "TagTimeline",
  priority: 20,
  match: ({ slug }) => slug === "tags" || slug.startsWith("tags/"),
  layout: "tag",
  generate: ({ content }) => {
    const tags = new Set()
    for (const entry of content || []) {
      const fm = entry && entry[1] && entry[1].data && entry[1].data.frontmatter
      const t = fm && Array.isArray(fm.tags) ? fm.tags : []
      for (const tag of t) tags.add(tag)
    }
    const pages = [...tags].map((tag) => ({
      slug: "tags/" + tag,
      title: "Tag: " + tag,
      data: { frontmatter: { title: "Tag: " + tag } },
    }))
    pages.push({ slug: "tags", title: "Tags", data: { frontmatter: { title: "Tags" } } })
    return pages
  },
  body: () => {
    const Component = ({ fileData, allFiles, cfg }) => {
      const locale = cfg?.locale ?? "en-GB"
      const s = String((fileData && fileData.slug) || "")
      const tag = s === "tags" || s === "tags/index" ? null : s.replace(/^tags\//, "")
      const events = []
      for (const f of allFiles || []) {
        if (!isRealNote(f)) continue
        const tags = (f.frontmatter && Array.isArray(f.frontmatter.tags)) ? f.frontmatter.tags : []
        if (tag) {
          if (!tags.includes(tag)) continue
        } else {
          if (tags.length === 0) continue // tag index: only tagged notes
        }
        const created = f.dates && f.dates.created
        if (created) events.push({ ...noteBase(f), date: created })
      }
      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      return h("div", { class: "timeline" }, [
        h("style", null, CSS),
        h("div", { class: "timeline-container" }, [
          h("div", { class: "timeline-line" }),
          ...events.map((e, i) => renderEvent(e, i, locale)),
        ]),
      ])
    }
    Component.css = CSS
    return Component
  },
})

export { TagTimeline }
