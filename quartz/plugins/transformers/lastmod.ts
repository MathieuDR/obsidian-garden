import fs from "fs"
import path from "path"
import { Repository } from "@napi-rs/simple-git"
import { QuartzTransformerPlugin } from "../types"
import { QuartzLogger } from "../../util/log"
import chalk from "chalk"

function parseCustomDateFormat(dateStr: string): Date | null {
  const customFormatMatch = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/.exec(dateStr)
  if (!customFormatMatch) {
    return null
  }

  const [_, year, month, day, hour, minute] = customFormatMatch
  const dt = new Date(
    parseInt(year),
    parseInt(month) - 1, // Month is 0-based in JavaScript
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
  )

  return isNaN(dt.getTime()) ? null : dt
}

function coerceDate(fp: string, d: any, debug: (message: string, ...args: any[]) => void): Date {
  debug(chalk.cyan(`Processing date value: ${JSON.stringify(d)}`))

  if (d === undefined) {
    debug(chalk.yellow(`  ↳ No date provided, using current date`))
    return new Date()
  }

  // First try parsing the custom format if it's a string
  if (typeof d === "string") {
    debug(chalk.blue(`  ↳ Attempting to parse custom format YYYY-MM-DD HH:mm`))
    const customDate = parseCustomDateFormat(d)
    if (customDate) {
      debug(chalk.green(`  ↳ Successfully parsed using custom format: ${customDate.toISOString()}`))
      return customDate
    }
    debug(chalk.yellow(`  ↳ Custom format parse failed, trying default JavaScript parsing`))
  }

  // If custom format fails, try the default JavaScript date parsing
  const dt = new Date(d)
  const invalidDate = isNaN(dt.getTime()) || dt.getTime() === 0

  if (invalidDate && d !== undefined) {
    debug(chalk.red(`  ↳ Invalid date found: "${d}"`))
    console.log(
      chalk.yellow(
        `\nWarning: found invalid date "${d}" in \`${fp}\`. Supported formats: YYYY-MM-DD HH:mm or https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format`,
      ),
    )
  } else if (!invalidDate) {
    debug(
      chalk.green(`  ↳ Successfully parsed using default JavaScript parsing: ${dt.toISOString()}`),
    )
  }

  return invalidDate ? new Date() : dt
}

export interface Options {
  priority: ("frontmatter" | "git" | "filesystem")[]
}

const defaultOptions: Options = {
  priority: ["frontmatter", "git", "filesystem"],
}

export const CreatedModifiedDate: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }
  return {
    name: "CreatedModifiedDate",
    markdownPlugins(ctx) {
      return [
        () => {
          let repos: { mainRepo?: Repository; subRepo?: Repository } = {}
          const debug = new QuartzLogger(ctx.argv.verbose).createDebug("LastMod")

          return async (_tree, file) => {
            let created: MaybeDate = undefined
            let modified: MaybeDate = undefined
            let published: MaybeDate = undefined

            const fp = file.data.filePath!
            const fullFp = path.isAbsolute(fp) ? fp : path.posix.join(file.cwd, fp)

            debug(chalk.magenta(`\nProcessing file: ${fp}`))

            for (const source of opts.priority) {
              debug(chalk.white.bold(`\nTrying source: ${source}`))

              if (source === "filesystem") {
                const st = await fs.promises.stat(fullFp)
                debug(chalk.cyan(`  Found filesystem dates:`))
                debug(chalk.cyan(`    birthtime: ${st.birthtime.toISOString()}`))
                debug(chalk.cyan(`    mtime: ${st.mtime.toISOString()}`))
                created ||= st.birthtimeMs
                modified ||= st.mtimeMs
              } else if (source === "frontmatter" && file.data.frontmatter) {
                debug(chalk.cyan(`  Found frontmatter:`))
                if (file.data.frontmatter.created) {
                  debug(chalk.cyan(`    created: ${file.data.frontmatter.created}`))
                }
                if (file.data.frontmatter.modified) {
                  debug(chalk.cyan(`    modified: ${file.data.frontmatter.modified}`))
                }
                if (file.data.frontmatter.published) {
                  debug(chalk.cyan(`    published: ${file.data.frontmatter.published}`))
                }
                created ||= file.data.frontmatter.created as MaybeDate
                modified ||= file.data.frontmatter.modified as MaybeDate
                published ||= file.data.frontmatter.published as MaybeDate
              } else if (source === "git") {
                try {
                  if (!repos.mainRepo && !repos.subRepo) {
                    repos = await initializeRepository(file.cwd, debug)
                  }

                  const relativePath = path.relative(file.cwd, fullFp)
                  const isInContent = relativePath.startsWith("content/")
                  const activeRepo = isInContent ? repos.subRepo : repos.mainRepo

                  debug(
                    chalk.cyan(`  Using repository: ${isInContent ? "content submodule" : "main"}`),
                  )

                  if (!activeRepo) {
                    throw new Error(`No valid repository found for ${relativePath}`)
                  }

                  const repoRelativePath = isInContent
                    ? path.relative(path.join(file.cwd, "content"), fullFp)
                    : relativePath

                  const gitModified =
                    await activeRepo.getFileLatestModifiedDateAsync(repoRelativePath)
                  debug(chalk.cyan(`  Git last modified: ${new Date(gitModified).toISOString()}`))
                  modified ||= gitModified
                } catch (error) {
                  console.error(chalk.red("\nGit operation failed:"), error)
                  console.error("File path:", fp)
                  console.error("Full path:", fullFp)
                }
              }
            }

            debug(chalk.white.bold("\nFinal date processing:"))
            debug(chalk.cyan("Processing created date:"))
            const finalCreated = coerceDate(fp, created, debug)
            debug(chalk.cyan("Processing modified date:"))
            const finalModified = coerceDate(fp, modified, debug)
            debug(chalk.cyan("Processing published date:"))
            const finalPublished = coerceDate(fp, published, debug)

            file.data.dates = {
              created: finalCreated,
              modified: finalModified,
              published: finalPublished,
            }

            debug(chalk.green("\nFinal dates:"))
            debug(chalk.green(`  created:   ${finalCreated.toISOString()}`))
            debug(chalk.green(`  modified:  ${finalModified.toISOString()}`))
            debug(chalk.green(`  published: ${finalPublished.toISOString()}`))
          }
        },
      ]
    },
  }
}
