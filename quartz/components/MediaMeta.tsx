import { Date, getDate } from "./Date"
import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import readingTime from "reading-time"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"
import { JSX } from "preact"
import style from "./styles/mediaMeta.scss"

interface ContentMetaOptions {}

const defaultOptions: ContentMetaOptions = {}

export default ((opts?: Partial<MediaMeta>) => {
  // Merge options with defaults
  function MediaMeta({ cfg, fileData, displayClass }: QuartzComponentProps) {
    const text = fileData.text
    const frontmatter = fileData.frontmatter

    if (text && frontmatter && frontmatter.media) {
      const segments: (string | JSX.Element)[] = []

      if (frontmatter.authors && frontmatter.authors.length > 0) {
        const authors = frontmatter.authors.join(" & ")
        const author_title = frontmatter.authors.length > 1 ? "Authors" : "Author"
        segments.push(<br />)
        segments.push(
          <span class="authors">
            {author_title}: {authors}
          </span>,
        )
      }

      return (
        <p class={classNames(displayClass, "media-meta")}>
          <span class="title">
            Title: {frontmatter.media} ({frontmatter["media-type"]})
          </span>
          {segments}
        </p>
      )
    } else {
      return null
    }
  }

  MediaMeta.css = style

  return MediaMeta
}) satisfies QuartzComponentConstructor
