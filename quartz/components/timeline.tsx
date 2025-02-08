import { QuartzComponentConstructor, QuartzComponentProps } from "./types"

interface TimelineEvent {
  type: 'created' | 'modified' | 'combined'
  date: Date
  slug: string
  title: string
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export default (() => {
  function Timeline(props: QuartzComponentProps) {
    const { children: events } = props
    
    if (events.length === 0) {
      return (
        <div class="timeline">
          <div class="timeline-container">
            <div class="timeline-event">No events found</div>
          </div>
        </div>
      )
    }

    return (
      <div class="timeline">
        <div class="timeline-container">
          {events.map((event, i) => (
            <div key={`${event.slug}-${event.type}-${i}`} class="timeline-event">
              <div class="timeline-date">
                {formatDate(event.date)}
              </div>
              <div class="timeline-content">
                <a href={"/" + event.slug} class="timeline-title">
                  {event.title}
                </a>
                <div class="timeline-type">
                  {event.type === 'combined' ? (
                    "Created and modified"
                  ) : event.type === 'created' ? (
                    "Created"
                  ) : (
                    "Last modified"
                  )}
                </div>
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
    
    .timeline-title {
      font-weight: 600;
      color: rgb(var(--ctp-accent));
      text-decoration: none;
      display: block;
      margin-bottom: 0.25rem;
    }
    
    .timeline-title:hover {
      text-decoration: underline;
    }
    
    .timeline-type {
      font-size: 0.9em;
      color: rgb(var(--ctp-subtext0));
    }
  `

  return Timeline
}) satisfies QuartzComponentConstructor
