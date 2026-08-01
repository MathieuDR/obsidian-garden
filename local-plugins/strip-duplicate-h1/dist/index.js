// Drop the first content H1 when it equals the note title (ports v4 Content.tsx behaviour),
// so ArticleTitle + a matching `# Title` heading in the body aren't shown twice.
// htmlPlugins runs on the hast tree (after OFM), which is where the comparison must happen.

function hastText(node) {
  if (!node) return ""
  if (node.type === "text") return node.value || ""
  if (Array.isArray(node.children)) return node.children.map(hastText).join("")
  return ""
}

function normalizeTitle(str) {
  return String(str)
    .toLowerCase()
    .replace(/[‘’‚‛'`]/g, "'")
    .replace(/[“”„‟"]/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .trim()
}

const StripDuplicateH1 = () => ({
  name: "StripDuplicateH1",
  htmlPlugins() {
    return [
      () => (tree, file) => {
        const title = file?.data?.frontmatter?.title
        if (!title || !Array.isArray(tree.children)) return
        // first real element (skip leading whitespace text nodes)
        const idx = tree.children.findIndex((c) => c && c.type === "element")
        if (idx < 0) return
        const first = tree.children[idx]
        if (first.tagName === "h1" && normalizeTitle(hastText(first)) === normalizeTitle(title)) {
          tree.children.splice(idx, 1)
        }
      },
    ]
  },
})

export { StripDuplicateH1 }
