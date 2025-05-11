import { ProcessedContent } from "../plugins/vfile"
import { FullSlug } from "../util/path"

export interface TimelineEvent {
  type: "created" | "modified"
  date: Date
  slug: string
  title: string
  tags?: string[]
  folder?: string
}

export function createTimelineEvents(fileData: any): TimelineEvent[] {
  const events: TimelineEvent[] = []
  const baseEvent = {
    slug: fileData.slug,
    title: fileData.title,
    tags: fileData.tags || [],
    folder: fileData.folder,
  }

  if (fileData.dates?.created) {
    events.push({
      ...baseEvent,
      type: "created",
      date: new Date(fileData.dates.created),
    })
  }

  if (fileData.dates?.modified) {
    events.push({
      ...baseEvent,
      type: "modified",
      date: new Date(fileData.dates.modified),
    })
  }

  return events
}

export function getTimelineEvents(
  content: ProcessedContent[],
  disallowedSlugs: Set<FullSlug>,
  disallowedTags: Set<string>,
  createdOnly: boolean = false,
) {
  const filteredContent = content
    .filter(([_, file]) => {
      const { data } = file
      if (data.slug == undefined) {
        return false
      }

      return (
        !disallowedSlugs.has(data.slug) &&
        !data.frontmatter?.tags?.some((tag) => disallowedTags.has(tag))
      )
    })
    .map(([_, file]) => ({
      slug: file.data.slug,
      title: file.data.frontmatter?.title || file.data.frontmatter?.aliases?.at(0),
      dates: { ...file.data.dates },
      tags: file.data.frontmatter?.tags || [],
      folder: file.data.slug?.toString().split("/").slice(0, -1).join("/"),
    }))

  const events = filteredContent
    .flatMap((fileData) => createTimelineEvents(fileData))
    .filter((event) => !createdOnly || event.type === "created")
    .sort((a, b) => {
      const timeComparison = b.date.getTime() - a.date.getTime()

      if (timeComparison === 0) {
        if (a.type === "created" && b.type === "modified") return 1
        if (a.type === "modified" && b.type === "created") return -1
      }

      return timeComparison
    })

  return events
}
