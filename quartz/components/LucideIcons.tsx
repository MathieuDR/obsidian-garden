import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { IconNode } from "lucide"
// @ts-ignore
import script from "./scripts/lucide.inline"
import { Microscope, NotebookText, PencilLine, Github, AtSign, MessageCircle, Linkedin } from "lucide"

const defaultOptions: LucideIconOptions = {
  icons: [],
}

export type LucideIconOptions = {
  icons: IconNode[]
}

export default ((opts?: Partial<LucideIconOptions>) => {
  const options: LucideIconOptions = { ...defaultOptions, ...opts }
   
  const Icons: QuartzComponent = ({}: QuartzComponentProps) => {
    return (<div id="smuggled" data-icons={JSON.stringify({Linkedin})}></div>)
  }
  
  Icons.afterDOMLoaded = script;
  return Icons
}) satisfies QuartzComponentConstructor