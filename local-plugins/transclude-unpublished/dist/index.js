// Port of v4 TranscludeUnpublished: embed block refs from UNPUBLISHED notes into
// published pages. Reads raw files from content/ (they are filtered out of the pipeline).
//
// v5 adaptation: OFM (order 30) converts wikilink AST nodes to HTML placeholders,
// so this plugin must run at order < 30 to intercept embedded wikilink nodes.
// Uses unist-util-visit (available) instead of mdast-util-find-and-replace (not installed).
import { fromMarkdown } from "mdast-util-from-markdown"
import { visit, SKIP } from "unist-util-visit"
import { readFileSync } from "fs"
import { dirname, join } from "path"

const defaultOptions = { commonDirectories: [] }

function parseFirstBlock(content) {
  const parsed = fromMarkdown(content)
  return parsed?.children?.[0] ?? null
}

function findBlock(content, blockRef) {
  for (const line of content.split("\n")) {
    if (line.includes(`^${blockRef}`)) {
      const clean = line.replace(`^${blockRef}`, "").trim()
      return parseFirstBlock(clean)
    }
  }
  return null
}

// Minimal frontmatter "publish" reader — avoids a yaml dependency.
function readPublishFlag(fmText) {
  const m = fmText.match(/^\s*publish\s*:\s*(.+?)\s*$/m)
  if (!m) return false
  return /^(true|yes)$/i.test(m[1].trim())
}

function firstFrontmatterValue(fmText, key) {
  const m = fmText.match(new RegExp(`^\\s*${key}\\s*:\\s*(.+?)\\s*$`, "m"))
  return m ? m[1].replace(/^["']|["']$/g, "").trim() : undefined
}

const TranscludeUnpublished = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }
  return {
    name: "TranscludeUnpublished",
    markdownPlugins() {
      return [
        () => (tree, file) => {
          const rel = (file?.data?.relativePath ?? file?.data?.filePath ?? "").toString()
          // rel is relative to content/ dir (e.g. "slips/my-note.md"), dirname gives "slips"
          const currentDir = rel ? dirname(rel) : ""

          const findAndReadFile = (filename) => {
            const searchDirs = [currentDir, ...opts.commonDirectories]
            for (const dir of searchDirs) {
              // Paths relative to repo root: content/<dir>/<filename>.md
              const filepath = join("content", dir, `${filename}.md`)
              try {
                return { content: readFileSync(filepath, { encoding: "utf8" }), filepath }
              } catch {
                continue
              }
            }
            return null
          }

          // Visit wikilink nodes that are embedded block references (e.g. ![[note#^block]])
          // This must run before OFM (order 30) which converts wikilink nodes to html nodes.
          visit(tree, "wikilink", (node, index, parent) => {
            if (!node.embedded) return
            if (!node.heading || !node.heading.startsWith("^")) return
            if (parent == null || index == null) return

            const fp = (node.path ?? "").trim()
            const blockRef = node.heading.slice(1).trim() // strip leading ^
            const alias = (node.alias ?? "").trim()

            const fileData = findAndReadFile(fp)
            if (!fileData) return

            const fmMatch = fileData.content.match(/^---\n([\s\S]*?)\n---/)
            if (!fmMatch) return
            const fmText = fmMatch[1]
            if (readPublishFlag(fmText)) return // published → leave to stock OFM

            const blockContent = findBlock(fileData.content, blockRef)
            if (!blockContent) return

            const title =
              firstFrontmatterValue(fmText, "title") ??
              firstFrontmatterValue(fmText, "id") ??
              fp

            const replacement = {
              type: "blockquote",
              children: [
                blockContent,
                {
                  type: "paragraph",
                  children: [{ type: "text", value: `— ${alias || fp} from ${title}` }],
                },
              ],
            }

            parent.children[index] = replacement
            return [SKIP, index]
          })
        },
      ]
    },
  }
}

export { TranscludeUnpublished }
