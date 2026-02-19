import { ComponentChildren } from "preact"
import { htmlToJsx } from "../../util/jsx"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

const normalizeTitle = (str: string) =>
  str
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B''`]/g, "'") // curly/smart single quotes → straight
    .replace(/[\u201C\u201D\u201E\u201F""]/g, '"')   // curly/smart double quotes → straight
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")

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
