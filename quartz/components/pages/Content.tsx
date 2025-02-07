import { htmlToJsx } from "../../util/jsx"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

const Content: QuartzComponent = ({ fileData, tree }: QuartzComponentProps) => {
  // Remove duplicated title
  if (fileData.filePath != "content/index.md" && tree.children[0].tagName === "h1" && tree.children[0].children[0].value.toLowerCase() === fileData.frontmatter?.title.toLowerCase()){
    let _header = tree.children.shift()
  }
  const content = htmlToJsx(fileData.filePath!, tree)
  const classes: string[] = fileData.frontmatter?.cssclasses ?? []
  const classString = ["popover-hint", ...classes].join(" ")
  return <article class={classString}>{content}</article>
}

export default (() => Content) satisfies QuartzComponentConstructor
