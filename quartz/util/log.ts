import { Spinner } from "cli-spinner"
import chalk from "chalk"

type ChalkStyleFn = (text: string) => string

export class QuartzLogger {
  verbose: boolean
  spinner: Spinner | undefined
  
  constructor(verbose: boolean) {
    this.verbose = verbose
  }

  start(text: string) {
    if (this.verbose) {
      console.log(text)
    } else {
      this.spinner = new Spinner(`%s ${text}`)
      this.spinner.setSpinnerString(18)
      this.spinner.start()
    }
  }

  end(text?: string) {
    if (!this.verbose) {
      this.spinner!.stop(true)
    }
    if (text) {
      console.log(text)
    }
  }

  log(messageOrStyle: string | ChalkStyleFn, ...args: any[]) {
    // If the first argument is a string, use default blue styling
    if (typeof messageOrStyle === 'string') {
      console.log(chalk.blue(`[Quartz] ${messageOrStyle}`), ...args)
      return
    }

    // If the first argument is a chalk function, use it and shift the args
    const [message, ...restArgs] = args
    console.log(messageOrStyle(`[Quartz] ${message}`), ...restArgs)
  }

  createDebug(prefix: string = 'Quartz') {
    return (messageOrStyle: string | ChalkStyleFn, ...args: any[]) => {
      if (!this.verbose) return

      // If the first argument is a string, use default blue styling
      if (typeof messageOrStyle === 'string') {
        console.log(chalk.blue(`[${prefix}] ${messageOrStyle}`), ...args)
        return
      }

      // If the first argument is a chalk function, use it and shift the args
      const [message, ...restArgs] = args
      console.log(messageOrStyle(`[${prefix}] ${message}`), ...restArgs)
    }
  }
}
