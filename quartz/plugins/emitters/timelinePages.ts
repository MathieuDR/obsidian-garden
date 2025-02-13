import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { FullPageLayout } from "../../cfg"
import { defaultListPageLayout, sharedPageComponents } from "../../../quartz.layout"
import { Timeline } from "../../components"
import { FilePath, pathToRoot } from "../../util/path"
import { QuartzLogger } from "../../util/log"
import { write } from "./helpers"
import { getTimelineEvents } from "../../util/timeline"
import chalk from "chalk"

interface Options {
  limit?: number
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
  events: TimelineEvent[],
) {
  const debug = new QuartzLogger(ctx.argv.verbose).createDebug("TimeLinePages")
  debug(chalk.blue, "Creating page:", slug)

  const cfg = ctx.cfg.configuration
  const allFiles = content.map((c) => c[1].data)

  const pageData = {
    slug,
    frontmatter: { title },
    filePath: slug,
  }

  const externalResources = pageResources(pathToRoot(slug), pageData, resources)

  debug(chalk.red, "  ↳ page data:", pageData)
  debug(chalk.red, "  ↳ external resources:", externalResources)
  debug(chalk.red, "  ↳ ctx:", ctx)
  debug(chalk.red, "  ↳ cfg:", cfg)

  const componentData: QuartzComponentProps = {
    ctx,
    fileData: pageData,
    externalResources: externalResources,
    cfg,
    children: events,
    tree: { type: "root", children: [] },
    allFiles,
  }

  const pageContent = renderPage(cfg, slug, componentData, opts, componentData.externalResources)

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
    ...defaultListPageLayout,
    pageBody: Timeline(),
    ...userOpts,
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

      const timelineEvents = getTimelineEvents(content, disallowedSlugs, disallowedTags).slice(
        0,
        limit,
      )
      const recentEvents = getTimelineEvents(content, disallowedSlugs, disallowedTags, true).slice(
        0,
        limit,
      )

      const timelinePage = await createPage(
        ctx,
        content,
        resources,
        opts,
        "timeline/index",
        "Timeline",
        timelineEvents,
      )

      const recentPage = await createPage(
        ctx,
        content,
        resources,
        opts,
        "recent/index",
        "Recent Notes",
        recentEvents,
      )

      return [timelinePage, recentPage]
    },
  }
}
