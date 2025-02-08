import { QuartzTransformerPlugin } from "../types"
import { Root, HTML } from "mdast"
import { visit } from "unist-util-visit"
import { ReplaceFunction, findAndReplace } from "mdast-util-find-and-replace"
import { FilePath, pathToRoot, slugTag, slugifyFilePath, FullSlug } from "../../util/path"
import { dirname, join } from "path"
import { readFileSync } from "fs"
import yaml from "js-yaml"
import markdown from "remark-parse"
import { fromMarkdown } from "mdast-util-from-markdown"

interface Options {
  debug: boolean
  commonDirectories: string[]
}

const defaultOptions: Options = {
  debug: false,
  commonDirectories: [],
}

const wikilinkRegex = new RegExp(/!\[\[([^\]#|]+)#\^([^\]|]+)(?:\|([^\]]+))?\]\]/g)

export const TranscludeUnpublished: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }
  return {
    name: "TranscludeUnpublished",
    markdownPlugins(ctx) {
      return [
        () => {
          return async (tree: Root, file) => {
            const currentSlug = file.data.slug! as FullSlug
            const currentDir = dirname(file.data.relativePath)

            const debug = (...args: any[]) => {
              if (ctx.argv.verbose) {
                console.log(`[TranscludeUnpublished][${currentSlug}]`, ...args)
              }
            }

            const parseMdast = (content: string): Root => {
              return fromMarkdown(content)?.children[0] ?? null
            }

            const findBlock = (content: string, blockRef: string): string | null => {
              const lines = content.split("\n")

              // Find the line containing the block reference
              for (const line of lines) {
                if (line.includes(`^${blockRef}`)) {
                  // Remove the block reference and trim whitespace
                  const cleanLine = line.replace(`^${blockRef}`, "").trim()
                  debug(cleanLine)
                  const parsedContent = parseMdast(cleanLine)
                  debug(parsedContent)

                  return parsedContent
                }
              }

              return null
            }

            const findAndReadFile = (
              filename: string,
            ): { content: string; filepath: string } | null => {
              const searchDirs = [`${currentDir}/`, ...opts.commonDirectories]
              debug("Searching in directories:", searchDirs)

              for (const dir of searchDirs) {
                const filepath = join("content", dir, `${filename}.md`)
                try {
                  const content = readFileSync(filepath, { encoding: "utf8" })
                  debug("Found file in:", filepath)
                  return { content, filepath }
                } catch (e) {
                  debug("Not found in:", filepath)
                  continue
                }
              }

              return null
            }

            // Create an array of replacements following OFM pattern
            const replacements: [RegExp, string | ReplaceFunction][] = [
              [
                wikilinkRegex,
                (value: string, ...capture: string[]) => {
                  let [rawFp, rawHeader, rawAlias] = capture
                  const fp = rawFp?.trim() ?? ""
                  const anchor = rawHeader?.trim() ?? ""
                  const alias = rawAlias?.trim()

                  debug("Looking for, trimmed:", fp)
                  const fileData = findAndReadFile(fp)
                  if (!fileData) {
                    debug("File not found in any location")
                    return false
                  }

                  // Quick parse frontmatter
                  const fmMatch = fileData.content.match(/^---\n([\s\S]*?)\n---/)
                  if (!fmMatch) {
                    debug("No frontmatter found")
                    return false
                  }

                  try {
                    const frontmatter = yaml.load(fmMatch[1], {
                      schema: yaml.JSON_SCHEMA,
                    }) as object
                    if (frontmatter.publish) {
                      debug("File is published, skipping")
                      return false
                    }

                    debug("Searching for block", anchor)
                    const blockContent = findBlock(fileData.content, anchor)
                    if (!blockContent) {
                      debug("Block reference not found")
                      return false
                    }

                    debug("Found block content:", blockContent)
                    const title =
                      frontmatter.title ??
                      frontmatter.alias?.[0] ??
                      frontmatter.aliases?.[0] ??
                      frontmatter.id ??
                      fp

                    debug("title", title, alias)

                    return {
                      type: "blockquote",
                      children: [
                        blockContent,
                        {
                          type: "paragraph",
                          children: [{ type: "text", value: `— ${alias} from ${title}` }],
                        },
                      ],
                    }
                  } catch (e) {
                    debug("Error parsing file:", e)
                    return false
                  }
                },
              ],
            ]

            // Apply all replacements
            findAndReplace(tree, replacements)
          }
        },
      ]
    },
  }
}

export default TranscludeUnpublished
