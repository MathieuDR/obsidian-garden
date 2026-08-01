// Port of v4 Nav.tsx: sidebar list of nav links with dividers.
import { h, Fragment } from "preact"

const CSS = `
nav.page-navigation { text-align: left; font-family: var(--bodyFont); margin: 0.5rem 0; }
nav.page-navigation ul {
  list-style: none; margin: 0; padding: 0;
  display: flex; flex-direction: row; flex-wrap: wrap; gap: 1rem; align-items: center;
}
nav.page-navigation li.divider { border-right: dotted 3px var(--secondary); height: 1em; }
nav.page-navigation a { color: var(--dark); text-decoration: none; }
nav.page-navigation a:hover { color: var(--secondary); }
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
