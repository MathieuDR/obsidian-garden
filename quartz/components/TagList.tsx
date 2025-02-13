import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { SimpleTagList } from "./simpleTagList"

const TagList: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const tags = fileData.frontmatter?.tags
  return tags ? (
    <SimpleTagList tags={tags} slug={fileData.slug!} displayClass={displayClass} />
  ) : null
}

export default (() => TagList) satisfies QuartzComponentConstructor
