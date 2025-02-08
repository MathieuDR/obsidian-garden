import fs from "fs"
import path from "path"
import { Repository } from "@napi-rs/simple-git"
import { QuartzTransformerPlugin } from "../types"
import chalk from "chalk"

export interface Options {
  priority: ("frontmatter" | "git" | "filesystem")[]
}

const defaultOptions: Options = {
  priority: ["frontmatter", "git", "filesystem"],
}

function coerceDate(fp: string, d: any): Date {
  const dt = new Date(d)
  const invalidDate = isNaN(dt.getTime()) || dt.getTime() === 0
  if (invalidDate && d !== undefined) {
    console.log(
      chalk.yellow(
        `\nWarning: found invalid date "${d}" in \`${fp}\`. Supported formats: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format`,
      ),
    )
  }

  return invalidDate ? new Date() : dt
}

async function initializeRepository(
  cwd: string,
  debug: (message: string, ...args: any[]) => void,
): Promise<{
  mainRepo: Repository | undefined
  subRepo: Repository | undefined
}> {
  try {
    debug("Initializing repositories...")
    debug("Working directory:", cwd)

    // Initialize main repository
    let mainRepo: Repository | undefined
    try {
      mainRepo = new Repository(cwd)
      const headRef = mainRepo.head()
      debug("✓ Main repo initialized:")
      debug(`  Branch: ${headRef.shorthand()}`)
      debug(`  Commit: ${headRef.target()}`)
    } catch (error) {
      console.error(chalk.red("✗ Failed to initialize main repo:"), error)
    }

    // Initialize content submodule repository
    let subRepo: Repository | undefined
    const contentPath = path.join(cwd, "content")
    try {
      if (fs.existsSync(contentPath)) {
        subRepo = new Repository(contentPath)
        const headRef = subRepo.head()
        debug("✓ Content submodule repo initialized:")
        debug(`  Branch: ${headRef.shorthand()}`)
        debug(`  Commit: ${headRef.target()}`)
      }
    } catch (error) {
      console.error(chalk.red("✗ Failed to initialize content submodule repo:"), error)
    }

    return { mainRepo, subRepo }
  } catch (error) {
    console.error(chalk.red("Repository initialization failed:"), error)
    return { mainRepo: undefined, subRepo: undefined }
  }
}

type MaybeDate = undefined | string | number
export const CreatedModifiedDate: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }
  return {
    name: "CreatedModifiedDate",
    markdownPlugins(ctx) {
      return [
        () => {
          let repos: { mainRepo?: Repository; subRepo?: Repository } = {}

          // Moved debug function to higher scope
          const debug = (message: string, ...args: any[]) => {
            if (ctx.argv.verbose) {
              console.log(chalk.blue(`[CreatedModifiedDate] ${message}`), ...args)
            }
          }

          return async (_tree, file) => {
            let created: MaybeDate = undefined
            let modified: MaybeDate = undefined
            let published: MaybeDate = undefined

            const fp = file.data.filePath!
            const fullFp = path.isAbsolute(fp) ? fp : path.posix.join(file.cwd, fp)
            for (const source of opts.priority) {
              if (source === "filesystem") {
                const st = await fs.promises.stat(fullFp)
                created ||= st.birthtimeMs
                modified ||= st.mtimeMs
              } else if (source === "frontmatter" && file.data.frontmatter) {
                created ||= file.data.frontmatter.created as MaybeDate
                modified ||= file.data.frontmatter.modified as MaybeDate
                published ||= file.data.frontmatter.published as MaybeDate
              } else if (source === "git") {
                try {
                  // Initialize repositories if not already done
                  if (!repos.mainRepo && !repos.subRepo) {
                    repos = await initializeRepository(file.cwd, debug)
                  }

                  // Determine which repository to use and adjust file path
                  const relativePath = path.relative(file.cwd, fullFp)
                  const isInContent = relativePath.startsWith("content/")
                  const activeRepo = isInContent ? repos.subRepo : repos.mainRepo

                  debug("Processing file:", relativePath)
                  debug("Using repository:", isInContent ? "content submodule" : "main")

                  if (!activeRepo) {
                    throw new Error(`No valid repository found for ${relativePath}`)
                  }

                  // Convert file path to be relative to the appropriate repository root
                  const repoRelativePath = isInContent
                    ? path.relative(path.join(file.cwd, "content"), fullFp)
                    : relativePath

                  debug("Repository-relative path:", repoRelativePath)

                  modified ||= await activeRepo.getFileLatestModifiedDateAsync(repoRelativePath)
                  debug("✓ Successfully got modified date")
                } catch (error) {
                  console.error(chalk.red("\nGit operation failed:"), error)
                  console.error("File path:", fp)
                  console.error("Full path:", fullFp)
                }
              }
            }

            file.data.dates = {
              created: coerceDate(fp, created),
              modified: coerceDate(fp, modified),
              published: coerceDate(fp, published),
            }
          }
        },
      ]
    },
  }
}

declare module "vfile" {
  interface DataMap {
    dates: {
      created: Date
      modified: Date
      published: Date
    }
  }
}
