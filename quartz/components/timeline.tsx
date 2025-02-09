import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { pathToRoot, slugTag } from "../util/path"
import { Date as DateComponent } from "./Date"
import { ValidLocale } from "../i18n"

interface TimelineEvent {
  type: "created" | "modified"
  date: Date
  slug: string
  title: string
  tags?: string[]
  folder?: string
}

function EventTags({ tags, slug }: { tags?: string[], slug: string }) {
  if (!tags || tags.length === 0) return null
  
  const baseDir = pathToRoot(slug)
  return (
    <ul className="tags">
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

export default (() => {
  function Timeline(props: QuartzComponentProps) {
    const { children: events, cfg } = props
    const locale = cfg?.locale as ValidLocale | undefined
    
    if (events.length === 0) {
      return (
        <div className="timeline">
          <div className="timeline-container">
            <div className="timeline-event">No events found</div>
          </div>
        </div>
      )
    }

    return (
      <div className="timeline">
        <div className="timeline-container">
          {events.map((event: TimelineEvent, i) => (
            <div key={`${event.slug}-${event.type}-${i}`} className="timeline-event">
              <div className="timeline-date">
                <DateComponent date={event.date} locale={locale} />
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <a href={"/" + event.slug} className="timeline-title">
                    {event.title}
                  </a>
                  <div className="timeline-type">
                    {event.type === "created" ? "Created" : "Last modified"}
                  </div>
                </div>
                {event.folder && (
                  <div className="timeline-folder">
                    {event.folder}
                  </div>
                )}
                <EventTags tags={event.tags} slug={event.slug} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  Timeline.css = `
    .timeline {
      max-width: 100%;
      margin: 2rem 0;
    }
    
    .timeline-container {
      position: relative;
      margin: 2rem 0;
    }
    
    .timeline-event {
      display: flex;
      margin-bottom: 1.5rem;
      gap: 1rem;
      padding: 1rem;
      background: rgb(var(--ctp-surface0));
      border-radius: 5px;
      border: 1px solid rgb(var(--ctp-surface1));
    }
    
    .timeline-date {
      min-width: 150px;
      color: rgb(var(--ctp-text));
    }
    
    .timeline-content {
      flex: 1;
    }
    
    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }
    
    .timeline-title {
      font-weight: 600;
      color: rgb(var(--ctp-accent));
      text-decoration: none;
    }
    
    .timeline-title:hover {
      text-decoration: underline;
    }
    
    .timeline-type {
      font-size: 0.9em;
      color: rgb(var(--ctp-subtext0));
    }

    .timeline-folder {
      font-size: 0.9em;
      color: rgb(var(--ctp-subtext1));
      margin-bottom: 0.5rem;
    }
    
    .tags {
      list-style: none;
      display: flex;
      padding-left: 0;
      gap: 0.4rem;
      margin: 0.5rem 0 0 0;
      flex-wrap: wrap;
    }
    
    .tags > li {
      display: inline-block;
      white-space: nowrap;
      margin: 0;
      overflow-wrap: normal;
    }
    
    .internal.tag-link {
      border-radius: 8px;
      background-color: var(--highlight);
      padding: 0.2rem 0.4rem;
      margin: 0;
      font-size: 0.9em;
    }
  `

  return Timeline
}) satisfies QuartzComponentConstructor
