import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { FullPageLayout } from "../../cfg"
import { defaultListPageLayout, sharedPageComponents } from "../../../quartz.layout"
import { Timeline } from "../../components"
import { FilePath, FullSlug, joinSegments, pathToRoot } from "../../util/path"
import { write } from "./helpers"
import { getTimelineEvents } from "../../util/timeline"
import chalk from "chalk"
import { CustomLogger } from "../../util/logger"
import { ProcessedContent, QuartzPluginData } from "../vfile"

interface Options {
  limit?: number
  disallowedSlugs?: FullSlug[]
  disallowedTags?: string[]
}

async function createPage(
  ctx: any,
  content: ProcessedContent[],
  resources: any,
  opts: FullPageLayout,
  slug: FullSlug,
  title: string,
  events: TimelineEvent[],
) {
  const debug = new CustomLogger(ctx.argv.verbose).createDebug("TimeLinePages")
  debug(chalk.blue, "Creating page:", slug)

  const cfg = ctx.cfg.configuration
  const allFiles = content.map((c) => c[1].data)

  const pageData: QuartzPluginData = {
    slug,
    frontmatter: { title }
  }

  const externalResources = pageResources(pathToRoot(slug), resources)

  debug(chalk.red, "  ↳ page data:", pageData)
  debug(chalk.red, "  ↳ external resources:", externalResources)
  // debug(chalk.red, "  ↳ ctx:", ctx)
  // debug(chalk.red, "  ↳ cfg:", cfg)

  const componentData: QuartzComponentProps = {
    ctx,
    fileData: pageData,
    externalResources: externalResources,
    cfg,
    children: events,
    tree: { type: "root" },
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
      const debug = new CustomLogger(ctx.argv.verbose).createDebug("TimeLinePages emitter")


      const timelineEvents = getTimelineEvents(content, disallowedSlugs, disallowedTags).slice(
        0,
        limit,
      )
      const recentEvents = getTimelineEvents(content, disallowedSlugs, disallowedTags, true).slice(
        0,
        limit,
      )

      debug(chalk.magenta, "timeline events: " +  timelineEvents.length)
      debug(chalk.magenta, "recent events: " + recentEvents.length)

      const timelinePage = await createPage(
        ctx,
        content,
        resources,
        opts,
        joinSegments("timeline", "index") as FullSlug,
        "Timeline",
        timelineEvents,
      )

      const recentPage = await createPage(
        ctx,
        content,
        resources,
        opts,
        joinSegments("recent", "index") as FullSlug,
        "Recent Notes",
        recentEvents,
      )

      return [timelinePage, recentPage]
    },
  }
}
