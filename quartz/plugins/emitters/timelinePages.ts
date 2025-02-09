import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { FullPageLayout } from "../../cfg"
import { defaultContentPageLayout, sharedPageComponents } from "../../../quartz.layout"
import { Timeline } from "../../components"
import { FilePath, pathToRoot } from "../../util/path"
import { write } from "./helpers"

interface TimelineEvent {
  type: "created" | "modified"
  date: Date
  slug: string
  title: string
}

interface Options {
  limit?: number
  layout?: Partial<FullPageLayout>
  disallowedSlugs?: string[]
  disallowedTags?: string[]
}

function createTimelineEvents(fileData: any): TimelineEvent[] {
  const events: TimelineEvent[] = []

  if (fileData.dates?.created) {
    events.push({
      type: "created",
      date: new Date(fileData.dates.created),
      slug: fileData.slug,
      title: fileData.title,
    })
  }

  if (fileData.dates?.modified) {
    events.push({
      type: "modified",
      date: new Date(fileData.dates.modified),
      slug: fileData.slug,
      title: fileData.title,
    })
  }

  return events
}

const getTimelineEvents = (
  content: [string, { data: any }][],
  disallowedSlugs: Set<string>,
  disallowedTags: Set<string>,
  createdOnly: boolean = false
) => {
  const filteredContent = content
    .filter(([_, file]) => {
      const { data } = file
      return !disallowedSlugs.has(data.slug) && !data.tags?.some((tag) => disallowedTags.has(tag))
    })
    .map(([_, file]) => ({
      slug: file.data.slug,
      title: file.data.frontmatter?.title || file.data.frontmatter?.aliases[0],
      dates: { ...file.data.dates },
    }))

  // Create new array of timeline events
  const events = filteredContent
    .flatMap((fileData) => createTimelineEvents(fileData))
    .filter(event => !createdOnly || event.type === "created")
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  return events
}

async function createPage(
  ctx: any,
  content: [string, { data: any }][],
  resources: any,
  opts: FullPageLayout,
  slug: string,
  title: string,
  events: TimelineEvent[]
) {
  const cfg = ctx.cfg.configuration
  const allFiles = content.map((c) => c[1].data)

  const pageData = {
    slug,
    frontmatter: { title },
    filePath: slug,
  }

  const componentData: QuartzComponentProps = {
    ctx,
    fileData: pageData,
    externalResources: pageResources(pathToRoot(slug), pageData, resources),
    cfg,
    children: events,
    tree: { type: "root", children: [] },
    allFiles,
  }

  const pageContent = renderPage(
    cfg,
    slug,
    componentData,
    opts,
    componentData.externalResources,
  )

  return write({
    ctx,
    content: pageContent,
    slug,
    ext: ".html",
  })
}

export const TimelinePages: QuartzEmitterPlugin<Options> = (userOpts) => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...defaultContentPageLayout,
    pageBody: Timeline(),
    ...userOpts?.layout,
  }

  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts
  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  return {
    name: "TimelinePages",
    getQuartzComponents() {
      return [
        Head,
        Header,
        Body,
        ...header,
        ...beforeBody,
        pageBody,
        ...afterBody,
        ...left,
        ...right,
        Footer,
      ]
    },
    async emit(ctx, content, resources): Promise<FilePath[]> {
      const limit = userOpts?.limit ?? 100
      const disallowedSlugs = new Set(userOpts?.disallowedSlugs ?? [])
      const disallowedTags = new Set(userOpts?.disallowedTags ?? [])

      // Get events for both pages
      const timelineEvents = getTimelineEvents(content, disallowedSlugs, disallowedTags)
        .slice(0, limit)
      const recentEvents = getTimelineEvents(content, disallowedSlugs, disallowedTags, true)
        .slice(0, limit)

      // Create both pages
      const timelinePage = await createPage(
        ctx,
        content,
        resources,
        opts,
        "timeline/index",
        "Timeline",
        timelineEvents
      )

      const recentPage = await createPage(
        ctx,
        content,
        resources,
        opts,
        "recent/index",
        "Recent Notes",
        recentEvents
      )

      return [timelinePage, recentPage]
    },
  }
}
