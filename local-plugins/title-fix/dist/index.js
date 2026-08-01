// Local transformer: derive a readable title for notes that only have aliases.
// note-properties (order 5) defaults a missing title to the file stem (the slug);
// running after it (order 6), prefer the first alias so slug-named notes read well.
// Ports the v4 frontmatter.ts title fix: title = title || aliases[0] || stem.
var TitleFix = () => ({
  name: "TitleFix",
  markdownPlugins() {
    return [
      () => (_tree, file) => {
        const fm = file?.data?.frontmatter
        if (!fm) return
        const alias = Array.isArray(fm.aliases) ? fm.aliases[0] : undefined
        const stem = file?.stem
        if (alias && (!fm.title || fm.title === stem)) {
          fm.title = alias
        }
      },
    ]
  },
})

export { TitleFix }
