import { PageLayout, SharedLayout } from "./quartz/cfg"
import { Microscope, NotebookText, PencilLine, ClipboardList, ScrollText } from "lucide"
import * as Component from "./quartz/components"

const explorerOpts = {
      title: "Notes",
      sortFn: (a, b) => {
        // Define folder order
        const folderOrder = {
          slips: 1,
          output: 2,
          research: 3,
        }

        // If both are folders
        if (a.isFolder && b.isFolder) {
          const orderA = folderOrder[a.displayName] || Number.MAX_SAFE_INTEGER
          const orderB = folderOrder[b.displayName] || Number.MAX_SAFE_INTEGER
          return orderA - orderB
        }

        // If one is a folder and one is a file
        if (!a.isFolder && b.isFolder) {
          return 1 // Files come after folders
        }
        if (a.isFolder && !b.isFolder) {
          return -1 // Folders come before files
        }

        // If both are files, sort by creation date (newest first)
        if (!a.isFolder && !b.isFolder) {
          afile = a.slugSegments.at(-1)
          bfile = b.slugSegments.at(-1)
          if(afile <= bfile){
            return 1
          } else {
            return -1
          }
        }

        return 0
      },
      mapFn: (node) => {
        // Only transform folder names, not files
        if (node.isFolder) {
          // Capitalize the first letter
          node.displayName = node.displayName.charAt(0).toUpperCase() + node.displayName.slice(1)

          // Set icon component based on folder
          // switch (node.displayName.toLowerCase()) {
          //   case "slips":
          //     node.icon = iconToSVG(NotebookText)
          //     break
          //   case "output":
          //     node.icon = iconToSVG(PencilLine)
          //     break
          //   case "research":
          //     node.icon = iconToSVG(Microscope)
          //     break
          // }
        }
      },
      folderDefaultState: "collapsed",
      useSavedState: true,
      order: ["filter", "sort", "map"], // Explicitly ensure mapping happens last
    };

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  // header: [Component.Nav({
  //   links: {
  //     Home: "/",
  //     About: "/output/pages/1746442137-about-me",
  //     Projects: "/output/pages/1746442167-current-projects",
  //     Garden: "/output/pages/1746441940-digital-garden"
  //   }
  // })],
  afterBody: [],
  footer: Component.Footer({
    links: {
      Home: "/",
      "Recent notes": "/recent",
      Timeline: "/timeline",
      "RSS Feed": "/index.xml",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
Component.ConditionalRender({
  component: Component.Breadcrumbs(),
  condition: (page) => page.fileData.slug !== "index",
}),
    Component.ArticleTitle(),
    Component.ContentMeta({
      showReadingTime: false,
    }),
    Component.MediaMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
Component.Flex({
  components: [
    {
      Component: Component.Search(),
      grow: true,
    },
    { Component: Component.Darkmode() },
    { Component: Component.ReaderMode() },
  ],
}),
    Component.Explorer(explorerOpts),
  ],
  right: [
    Component.DesktopOnly(Component.TableOfContents()),
    Component.RecentNotes(),
  ],
  afterBody: [
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.Explorer(explorerOpts),
  ],
  right: [],
}
