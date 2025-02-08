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
      title: fileData.title
    })
  }
  
  if (fileData.dates?.modified) {
    events.push({
      type: 'modified',
      date: new Date(fileData.dates.modified),
      slug: fileData.slug,
      title: fileData.title
    })
  }
  
  return [  ...events ]
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
      compacted.push({
        ...current,
        date: new Date(current.date.getTime())});
      i++
    }
  }
  
  return [...compacted]
}

const getTimelineEvents = (content: [string, { data: any }][],
  disallowedSlugs: Set<string>,
  disallowedTags: Set<string>) => {
  const filteredContent = content
    .filter(([_, file]) => {
      const { data } = file;
      return !disallowedSlugs.has(data.slug) && 
             !data.tags?.some(tag => disallowedTags.has(tag));
    })
    .map(([_, file]) => ({
      slug: file.data.slug,
      title: file.data.frontmatter?.title || file.data.frontmatter?.aliases[0],
      dates: { ...file.data.dates } 
    }));

  // Create new array of timeline events
  const events = filteredContent
    .flatMap(fileData => createTimelineEvents(fileData))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return compactEvents(events);
};

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
      const allFiles = content.map((c) => c[1].data)
      const slug = "timeline/index" as const
      const limit = userOpts?.limit ?? 100
      const disallowedSlugs = new Set(userOpts?.disallowedSlugs ?? [])
      const disallowedTags = new Set(userOpts?.disallowedTags ?? [])


      const compactedEvents = getTimelineEvents([...content], disallowedSlugs, disallowedTags).slice(0, limit)
      const timelinePageData = {
        slug,
        frontmatter: { title: "Timeline" },
        filePath: slug,
      }

      const componentData: QuartzComponentProps = {
        ctx,
        fileData: timelinePageData,
        externalResources: pageResources(pathToRoot(slug), timelinePageData, resources),
        cfg,
        children: compactedEvents,
        tree: { type: 'root', children: [] },
        allFiles,
      }

      const pageContent = renderPage(
        cfg,
        slug,
        componentData,
        opts,
        componentData.externalResources
      )

      return [await write({
        ctx,
        content: pageContent,
        slug,
        ext: ".html",
      })]
    },
  }
}
