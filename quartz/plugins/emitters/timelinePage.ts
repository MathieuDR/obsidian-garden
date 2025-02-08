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
  type: 'created' | 'modified' | 'combined'
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
      type: 'created',
      date: new Date(fileData.dates.created),
      slug: fileData.slug,
      title: fileData.frontmatter?.title || fileData.slug
    })
  }
  
  if (fileData.dates?.modified) {
    events.push({
      type: 'modified',
      date: new Date(fileData.dates.modified),
      slug: fileData.slug,
      title: fileData.frontmatter?.title || fileData.slug
    })
  }
  
  return events
}

function compactEvents(events: TimelineEvent[]): TimelineEvent[] {
  const compacted: TimelineEvent[] = []
  let i = 0
  
  while (i < events.length) {
    const current = events[i]
    const next = events[i + 1]
    
    if (
      next && 
      current.slug === next.slug && 
      Math.abs(current.date.getTime() - next.date.getTime()) < 1000 * 60 * 60 * 12 // 12 hour threshold
    ) {
      compacted.push({
        type: 'combined',
        date: new Date(Math.max(current.date.getTime(), next.date.getTime())),
        slug: current.slug,
        title: current.title
      })
      i += 2
    } else {
      compacted.push(current)
      i++
    }
  }
  
  return compacted
}

export const TimelinePage: QuartzEmitterPlugin<Options> = (userOpts) => {
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
    name: "TimelinePage",
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
      const cfg = ctx.cfg.configuration
      const slug = "timeline" as const
      const limit = userOpts?.limit ?? 100
      const disallowedSlugs = new Set(userOpts?.disallowedSlugs ?? [])
      const disallowedTags = new Set(userOpts?.disallowedTags ?? [])

      // Filter and process files
      const allEvents = content
        .map((c) => c[1].data)
        .filter(fileData => {
          // Skip files with disallowed slugs
          if (disallowedSlugs.has(fileData.slug)) return false
          
          // Skip files with disallowed tags
          if (fileData.tags?.some((tag: string) => disallowedTags.has(tag))) return false
          
          return true
        })
        .flatMap(createTimelineEvents)
        .sort((a, b) => b.date.getTime() - a.date.getTime())

      // Compact events and apply limit
      const compactedEvents = compactEvents(allEvents).slice(0, limit)

      // Create a fake file for the timeline page
      const timelineFile = {
        slug,
        frontmatter: { 
          title: "Timeline",
          tags: [] 
        },
        filePath: slug,
        dates: undefined,
        hash: "",
        timestamp: new Date().getTime(),
        description: undefined,
        tags: [],
        links: [],
        content: "",
      }

      const externalResources = pageResources(pathToRoot(slug), timelineFile, resources)
      const componentData: QuartzComponentProps = {
        ctx,
        fileData: timelineFile,
        externalResources,
        cfg,
        children: [],
        tree: {
          type: 'root',
          children: []
        },
        allFiles: compactedEvents,
      }

      const pageContent = renderPage(cfg, slug, componentData, opts, externalResources)
      const fp = await write({
        ctx,
        content: pageContent,
        slug,
        ext: ".html",
      })

      return [fp]
    },
  }
}
