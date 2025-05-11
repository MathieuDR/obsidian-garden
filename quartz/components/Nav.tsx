import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/nav.scss"
import { version } from "../../package.json"
import { i18n } from "../i18n"

interface Options {
  links: Record<string, string>
}

export default ((opts?: Options) => {
  const Nav: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
    const linkEntries = Object.entries(opts?.links ?? [])
    return (
      <>
      <div class="nav-break"></div>
      <nav class={`${displayClass ?? "page-navigation"}`}>
        <ul>
          {linkEntries.map(([text, link], index) => (
            <>
              <li>
                <a href={link}>{text}</a>
              </li>
              {index < linkEntries.length - 1 && <li className="divider"></li>}
            </>
          ))}
        </ul>
      </nav>
      </>
    )
  }

  Nav.css = style
  return Nav
}) satisfies QuartzComponentConstructor
