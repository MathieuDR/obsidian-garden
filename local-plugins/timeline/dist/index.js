// Local pageType plugin: generates a /timeline page listing published notes
// chronologically (newest first), grouped by year. Ports the essence of the v4
// timeline emitter to the v5 pageType API (generate + match + body).
import { h } from "preact"

function fmtDate(d, locale) {
  try {
    return new Date(d).toLocaleDateString(locale ?? "en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return ""
  }
}

const TimelineBody = () => {
  const Timeline = ({ allFiles, cfg }) => {
    const locale = cfg?.locale ?? "en-GB"
    const events = (allFiles || [])
      .filter((f) => f && f.slug && f.slug !== "timeline" && !String(f.slug).endsWith("/index"))
      .map((f) => ({
        slug: f.slug,
        title: (f.frontmatter && f.frontmatter.title) || f.slug,
        date: f.dates && f.dates.created,
      }))
      .filter((e) => e.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const byYear = {}
    for (const e of events) {
      const y = new Date(e.date).getFullYear()
      ;(byYear[y] || (byYear[y] = [])).push(e)
    }
    const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a))

    return h(
      "div",
      { class: "timeline" },
      years.map((y) =>
        h("section", { class: "timeline-year", key: y }, [
          h("h2", {}, String(y)),
          h(
            "ul",
            { class: "timeline-list" },
            byYear[y].map((e) =>
              h("li", { class: "timeline-entry", key: e.slug }, [
                h("span", { class: "timeline-date" }, fmtDate(e.date, locale)),
                h("a", { href: "/" + e.slug, class: "internal" }, e.title),
              ]),
            ),
          ),
        ]),
      ),
    )
  }
  Timeline.css = `
.timeline-list{list-style:none;padding:0;margin:0 0 1.5rem}
.timeline-year>h2{margin:1.5rem 0 .4rem;border-bottom:1px solid var(--lightgray)}
.timeline-entry{display:flex;gap:.75rem;padding:.15rem 0;align-items:baseline}
.timeline-date{color:var(--gray);min-width:7rem;font-variant-numeric:tabular-nums;font-size:.85em}
`
  return Timeline
}

const Timeline = (opts) => ({
  name: "Timeline",
  priority: 10,
  match: ({ slug }) => slug === "timeline",
  layout: "content",
  generate: () => [
    { slug: "timeline", title: "Timeline", data: { frontmatter: { title: "Timeline" } } },
  ],
  body: () => TimelineBody(),
})

export { Timeline }
