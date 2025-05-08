import { joinSegments } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import { IconNode, Microscope, NotebookText, PencilLine, ClipboardList, ScrollText, icons  } from "lucide"
import { iconToSVG } from "../../components/Icon"
import fs from "fs"
import path from "path";
import { renderToString } from "preact-render-to-string";

const defaultOptions: LucidIconOptions = {
  icons: []
}

export type LucidIconOptions = {
  icons: IconNode[]
}

export const LucidIcons: QuartzEmitterPlugin = (opts: LucidIconOptions) => {
  const options = {...defaultOptions, ...opts}

  return {
    name: "LucidIconsEmitter",
    async *emit({ argv, cfg }) {
      const outputStaticPath = joinSegments(argv.output, "static", "lucide")
      await fs.promises.mkdir(outputStaticPath, { recursive: true });

      for (const iconData of options.icons) {
        const iconName = Object.keys(icons).find(
          (key) => icons[key] === iconData
        );

        if (iconName) {
          const svgElement = iconToSVG(iconData);
          const svgContent = renderToString(svgElement);
          const outputPath = joinSegments(outputStaticPath, `${iconName}.svg`);
          await fs.promises.writeFile(outputPath, svgContent, "utf-8");
          console.log(`Generated ${iconName}.svg`);
          yield outputPath; // Yield the generated file path
        } else {
          console.warn("Could not determine the name for an icon.");
        }
      }
    }
  }
}
