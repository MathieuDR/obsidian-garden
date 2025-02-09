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
import { getTimelineEvents } from "../../util/timeline"

interface Options {
  limit?: number
  layout?: Partial<FullPageLayout>
  disallowedSlugs?: string[]
  disallowedTags?: string[]
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

      const timelineEvents = getTimelineEvents(content, disallowedSlugs, disallowedTags)
        .slice(0, limit)
      const recentEvents = getTimelineEvents(content, disallowedSlugs, disallowedTags, true)
        .slice(0, limit)

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
