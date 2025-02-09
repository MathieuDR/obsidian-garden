import { pathToRoot, slugTag } from "../util/path"
import { classNames } from "../util/lang"

interface SimpleTagListProps {
  tags: string[]
  slug: string
  displayClass?: string
}

export function SimpleTagList({ tags, slug, displayClass }: SimpleTagListProps) {
  if (!tags || tags.length === 0) return null

  const baseDir = pathToRoot(slug)
  return (
    <ul className={classNames(displayClass, "tags")}>
      {tags.map((tag) => {
        const linkDest = baseDir + `/tags/${slugTag(tag)}`
        return (
          <li key={tag}>
            <a href={linkDest} className="internal tag-link">
              {tag}
            </a>
          </li>
        )
      })}
    </ul>
  )
}
