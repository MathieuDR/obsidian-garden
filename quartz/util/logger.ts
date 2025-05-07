
import chalk from "chalk"
import { QuartzLogger } from "./log"

type ChalkStyleFn = (text: string) => string

export class CustomLogger {
  quartzlogger: QuartzLogger
  verbose: Boolean

  constructor(verbose: boolean) {
    this.quartzlogger = new QuartzLogger(verbose)
    this.verbose = verbose
  }

  start(text: string) {
    this.quartzlogger.start(text)
  }

  end(text?: string) {
    this.quartzlogger.end(text)
  }
  updateText(text: string) {
    this.quartzlogger.updateText(text)
  }

  log(messageOrStyle: string | ChalkStyleFn, ...args: any[]) {
    // If the first argument is a string, use default blue styling
    if (typeof messageOrStyle === "string") {
      console.log(chalk.blue(`[Quartz] ${messageOrStyle}`), ...args)
      return
    }

    // If the first argument is a chalk function, use it and shift the args
    const [message, ...restArgs] = args
    console.log(messageOrStyle(`[Quartz] ${message}`), ...restArgs)
  }

  createDebug(prefix: string = "Quartz") {
    return (messageOrStyle: string | ChalkStyleFn, ...args: any[]) => {
      if (!this.verbose) return

      // If the first argument is a string, use default blue styling
      if (typeof messageOrStyle === "string") {
        console.log(chalk.blue(`[${prefix}] ${messageOrStyle}`), ...args)
        return
      }

      // If the first argument is a chalk function, use it and shift the args
      const [message, ...restArgs] = args
      console.log(messageOrStyle(`[${prefix}] ${message}`), ...restArgs)
    }
  }
}
