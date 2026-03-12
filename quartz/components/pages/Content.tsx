import { ComponentChildren } from "preact"
import { htmlToJsx } from "../../util/jsx"
import { normalizeTitle } from "../../util/escape"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

const Content: QuartzComponent = ({ fileData, tree }: QuartzComponentProps) => {


  if (
    tree.children[0].tagName === "h1" &&
    normalizeTitle(tree.children[0].children[0].value) === normalizeTitle(fileData.frontmatter?.title ?? "")
  ) {
    let _header = tree.children.shift()
  } else if (tree.children[0].tagName === "h1") {
    console.log("\n----------\nTITLE MISMATCH\n----------")
    console.log("h1: " + tree.children[0].children[0].value)
    console.log("title: " + (fileData.frontmatter?.title ?? ""))

    console.log("n(h1): " + normalizeTitle(tree.children[0].children[0].value))
    console.log("n(title): " + normalizeTitle(fileData.frontmatter?.title ?? ""))
  }

  const content = htmlToJsx(fileData.filePath!, tree) as ComponentChildren
  const classes: string[] = fileData.frontmatter?.cssclasses ?? []
  const classString = ["popover-hint", ...classes].join(" ")
  return <article class={classString}>{content}</article>
}

export default (() => Content) satisfies QuartzComponentConstructor
