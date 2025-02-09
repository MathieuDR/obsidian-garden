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
          <div className="timeline-line"></div>
          {events.map((event: TimelineEvent, i) => (
            <div 
              key={`${event.slug}-${event.type}-${i}`} 
              className={`timeline-event ${i % 2 === 0 ? 'left' : 'right'}`}
            >
              <div className="timeline-connector">
                <div className="timeline-dot"></div>
                <div className="timeline-line-to-content"></div>
              </div>
              <div className="timeline-type-date">
                <span className="timeline-type">
                  {event.type === "created" ? "Created" : "Last modified"}
                </span>
                <span className="timeline-date">
                  <DateComponent date={event.date} locale={locale} />
                </span>
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <a href={"/" + event.slug} className="timeline-title">
                    {event.title}
                  </a>
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
      width: 100%;
      margin: 4rem 0;
    }
    
    .timeline-container {
      position: relative;
      max-width: 100%;
      margin: 0 auto;
    }
    
    .timeline-line {
      position: absolute;
      left: 50%;
      top: 0;
      bottom: 0;
      width: 4px;
      background: rgb(var(--ctp-surface2));
      transform: translateX(-50%);
    }
    
    .timeline-event {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.5rem;
      position: relative;
      width: calc(50% - 2rem);
      margin: 2rem 0;
    }
    
    .timeline-event.left {
      margin-right: auto;
      padding-right: 2rem;
    }
    
    .timeline-event.right {
      margin-left: auto;
      padding-left: 2rem;
    }
    
    .timeline-connector {
      position: absolute;
      display: flex;
      align-items: center;
      top: 1.5rem;
      width: 2rem;
    }
    
    .timeline-event.left .timeline-connector {
      right: -8px;
      justify-content: flex-end;
    }
    
    .timeline-event.right .timeline-connector {
      left: -7px;
      justify-content: flex-start;
    }
    
    .timeline-dot {
      width: 16px;
      height: 16px;
      background: rgb(var(--ctp-accent));
      border-radius: 50%;
      z-index: 2;
    }
    
    .timeline-line-to-content {
      position: absolute;
      height: 2px;
      background: rgb(var(--ctp-surface2));
      width: 100%;
    }
    
    .timeline-type-date {
      display: flex;
      flex-direction: column;
      margin-bottom: 0.25rem;
      color: rgb(var(--ctp-subtext0));
    }
    
    .timeline-event.right .timeline-type-date {
      align-items: flex-start;
    }
    
    .timeline-event.left .timeline-type-date {
      align-items: flex-end;
    }
    
    .timeline-type {
      font-size: 0.9em;
      font-weight: 600;
      margin-bottom: 0.2rem;
    }
    
    .timeline-content {
      background: rgb(var(--ctp-surface0));
      border: 1px solid rgb(var(--ctp-surface1));
      border-radius: 8px;
      padding: 1rem;
    }
    
    .timeline-header {
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

    @media (max-width: 1200px) {
      .timeline-event.left .timeline-connector {
        justify-content: unset;
      }

      .timeline-container {
        padding-left: 2rem;
        padding-right: 1rem;
      }
      
      .timeline-line {
        left: 2rem;
      }
      
      .timeline-event {
        width: calc(100% - 2rem);
        margin-left: auto !important;
        padding-left: 2rem !important;
        padding-right: 0 !important;
      }
      
      .timeline-connector {
        left: 0 !important;
        right: auto !important;
      }

      .timeline-dot{
        margin-left: -8px;
      }
      
      .timeline-type-date {
        align-items: flex-start !important;
      }
      .timeline-content{
        max-width: 90%
      }
    }
  `

  return Timeline
}) satisfies QuartzComponentConstructor
