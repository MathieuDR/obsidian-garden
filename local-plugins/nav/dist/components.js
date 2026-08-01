// Port of v4 Nav.tsx: sidebar list of nav links with dividers.
import { h, Fragment } from "preact"

const CSS = `
.page-navigation { margin-top: 0.5rem; }
.page-navigation ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.35rem; }
.page-navigation li.divider { border-top: 1px solid var(--lightgray); margin: 0.15rem 0; height: 0; }
.page-navigation a { color: var(--dark); text-decoration: none; }
.page-navigation a:hover { color: var(--secondary); }
`

const Nav = (opts) => {
  const NavComponent = ({ displayClass }) => {
    const linkEntries = Object.entries(opts?.links ?? {})
    if (linkEntries.length === 0) return null
    return h("nav", { class: "page-navigation " + (displayClass ?? "") },
      h("ul", null, linkEntries.map(([text, link], i) =>
        h(Fragment, { key: link }, [
          h("li", null, h("a", { href: link }, text)),
          i < linkEntries.length - 1 ? h("li", { class: "divider" }) : null,
        ]),
      )),
    )
  }
  NavComponent.css = CSS
  return NavComponent
}

export { Nav }
