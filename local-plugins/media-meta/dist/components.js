// Port of v4 MediaMeta.tsx: shows media title/type + authors when frontmatter.media is set.
import { h } from "preact"

const CSS = `
p.media-meta { color: var(--gray); font-size: 0.9rem; margin: 0.2rem 0 0.6rem; }
p.media-meta .title { font-weight: 600; }
`

const MediaMeta = (opts) => {
  const MediaMetaComponent = ({ fileData, displayClass }) => {
    const fm = fileData?.frontmatter
    if (!fileData?.text || !fm || !fm.media) return null

    const segments = []
    const authors = fm.authors
    if (Array.isArray(authors) && authors.length > 0) {
      const label = authors.length > 1 ? "Authors" : "Author"
      segments.push(h("br", { key: "br" }))
      segments.push(h("span", { class: "authors", key: "authors" }, `${label}: ${authors.join(" & ")}`))
    }

    return h("p", { class: "media-meta " + (displayClass ?? "") }, [
      h("span", { class: "title", key: "title" }, `Title: ${fm.media} (${fm["media-type"]})`),
      ...segments,
    ])
  }
  MediaMetaComponent.css = CSS
  return MediaMetaComponent
}

export { MediaMeta }
