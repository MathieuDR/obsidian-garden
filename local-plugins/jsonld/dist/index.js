// Port of v4 jsonLd.tsx: schema.org structured data injected into each page head.
import { h } from "preact"

const MEDIA_TYPE_MAP = { article: "Article", book: "Book", video: "VideoObject", podcast: "PodcastEpisode" }

const defaultOptions = {
  author: { name: "" },
  defaultType: "Article",
  includeTags: true,
  tagTypeMap: { thought: "BlogPosting", gateway: "CollectionPage" },
}

function parseAuthorName(raw) {
  const parts = String(raw).split(",").map((s) => s.trim())
  return parts.length === 2 ? `${parts[1]} ${parts[0]}` : raw
}
function toPersonObject(name) {
  return { "@type": "Person", name }
}
function stripUndefined(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null))
}

function resolveSchemaType(pageData, options, ldOverrides) {
  if (typeof ldOverrides["type"] === "string") return ldOverrides["type"]
  const slug = pageData.slug ?? ""
  if (slug === "index") return "WebSite"
  if (slug.startsWith("tags/")) return "CollectionPage"
  if (slug.endsWith("/index")) return "WebPage"
  const tags = pageData.frontmatter?.tags ?? []
  for (const tag of tags) if (options.tagTypeMap[tag]) return options.tagTypeMap[tag]
  return options.defaultType
}

function buildIsBasedOn(fm) {
  const media = fm["media"]
  const mediaUrl = fm["media-url"]
  const mediaType = fm["media-type"]
  const rawAuthors = fm["authors"]
  if (!media && !mediaUrl && !rawAuthors) return undefined
  const schemaType = mediaType ? (MEDIA_TYPE_MAP[String(mediaType).toLowerCase()] ?? "CreativeWork") : "CreativeWork"
  const authorList = rawAuthors
    ? (Array.isArray(rawAuthors) ? rawAuthors : [rawAuthors]).map((a) => toPersonObject(parseAuthorName(a)))
    : undefined
  const result = { "@type": schemaType }
  if (media) result["name"] = media
  if (mediaUrl) result["url"] = mediaUrl
  if (authorList) result["author"] = authorList.length === 1 ? authorList[0] : authorList
  return result
}

function resolveImageUrl(value, baseUrl) {
  if (typeof value !== "string" || !value) return undefined
  if (value.startsWith("http://") || value.startsWith("https://")) return value
  return `${baseUrl}${value.startsWith("/") ? value : "/" + value}`
}

function buildJsonLd(pageData, cfg, options, baseUrl) {
  const fm = pageData.frontmatter ?? {}
  const ldOverrides = {}
  for (const [k, v] of Object.entries(fm)) if (k.startsWith("ld-")) ldOverrides[k.slice(3)] = v

  const schemaType = resolveSchemaType(pageData, options, ldOverrides)
  const slug = pageData.slug ?? ""
  const pageUrl = `${baseUrl}/${slug}`
  const ownerPerson = { "@type": "Person", ...options.author }
  const { type: _t, ...ldRest } = ldOverrides

  if (schemaType === "WebSite") {
    return stripUndefined({ "@context": "https://schema.org", "@type": "WebSite", name: cfg.pageTitle, url: baseUrl, author: ownerPerson, ...ldRest })
  }
  if (schemaType === "CollectionPage" || schemaType === "WebPage") {
    const title = fm["title"] ?? ""
    return stripUndefined({ "@context": "https://schema.org", "@type": schemaType, name: title || undefined, url: pageUrl, author: ownerPerson, ...ldRest })
  }

  const title = fm["title"] ?? ""
  const description = pageData.description ?? undefined
  const createdRaw = fm["created"]
  const modifiedRaw = fm["modified"]
  const datePublished = createdRaw ? new Date(createdRaw).toISOString() : undefined
  const dateModified = modifiedRaw ? new Date(modifiedRaw).toISOString() : datePublished
  const tags = fm["tags"] ?? []
  const fmKeywords = fm["keywords"]
  const extraKeywords = fmKeywords ? (Array.isArray(fmKeywords) ? fmKeywords : [fmKeywords]) : []
  const allKeywords = [...new Set([...tags, ...extraKeywords])]
  const keywords = options.includeTags && allKeywords.length > 0 ? allKeywords.join(", ") : undefined
  const featuredImage = resolveImageUrl(fm["featured-image"], baseUrl)
  const isBasedOn = buildIsBasedOn(fm)

  return stripUndefined({
    "@context": "https://schema.org",
    "@type": schemaType,
    headline: title || undefined,
    url: pageUrl,
    mainEntityOfPage: pageUrl,
    description,
    datePublished,
    dateModified,
    author: ownerPerson,
    publisher: ownerPerson,
    keywords,
    image: featuredImage,
    identifier: fm["id"] ?? undefined,
    isBasedOn,
    ...ldRest,
  })
}

const JsonLd = (userOpts) => {
  const options = {
    ...defaultOptions,
    ...userOpts,
    tagTypeMap: { ...defaultOptions.tagTypeMap, ...(userOpts?.tagTypeMap ?? {}) },
    author: { ...defaultOptions.author, ...(userOpts?.author ?? {}) },
  }
  return {
    name: "JsonLd",
    async *emit() {},
    externalResources: (ctx) => {
      const cfg = ctx.cfg.configuration
      if (!cfg.baseUrl) return {}
      const baseUrl = `https://${cfg.baseUrl}`
      return {
        additionalHead: [
          (pageData) =>
            h("script", {
              type: "application/ld+json",
              dangerouslySetInnerHTML: { __html: JSON.stringify(buildJsonLd(pageData, cfg, options, baseUrl)) },
            }),
        ],
      }
    },
  }
}

export { JsonLd }
