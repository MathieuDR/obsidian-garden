// Blacklist tags from display (ports v4 frontmatter.ts filterTags = ["zettelkasten", "slip"]).
// Runs after note-properties (order 5) so frontmatter.tags is populated; removing them here
// hides them from tag-list/recent-notes/timeline AND stops tag pages being generated for them.
const BLACKLIST = ["zettelkasten", "slip"]

const FilterTags = () => ({
  name: "FilterTags",
  markdownPlugins() {
    return [
      () => (_tree, file) => {
        const fm = file?.data?.frontmatter
        if (!fm || !Array.isArray(fm.tags)) return
        fm.tags = fm.tags.filter((t) => !BLACKLIST.includes(String(t).toLowerCase()))
      },
    ]
  },
})

export { FilterTags }
