import { QuartzEmitterPlugin } from "../types"
import { QuartzPluginData } from "../vfile"
import { GlobalConfiguration } from "../../cfg"

export interface JsonLdPersonConfig {
  /** Display name, e.g. "Mathieu Deraedt" */
  name: string
  /** Personal page URL */
  url?: string
  /**
   * Other URLs that represent the same person (social profiles, ORCID, etc.)
   * Helps search engines consolidate identity across platforms via schema.org sameAs.
   * Example: ["https://github.com/you", "https://linkedin.com/in/you"]
   */
  sameAs?: string[]
}

export interface JsonLdOptions {
  /** Site owner — used as schema `author` and `publisher` on every page */
  author: JsonLdPersonConfig
  /**
   * Maps note tag values to schema.org types.
   * Tags are checked in array order; the first match wins.
   * Falls back to `defaultType` when no tag matches.
   *
   * Common choices:
   *   "BlogPosting"  — informal, personal, social-shareable (thoughts)
   *   "Article"      — general / neutral, good for most notes
   *   "TechArticle"  — procedural / instructional (blueprints, how-tos)
   */
  tagTypeMap: Record<string, string>
  /** Schema type used when no tagTypeMap entry matches. Default: "Article" */
  defaultType: string
  /** Include tags + frontmatter `keywords` as schema `keywords`. Default: true */
  includeTags: boolean
}

const defaultOptions: JsonLdOptions = {
  author: { name: "" },
  defaultType: "Article",
  includeTags: true,
  tagTypeMap: {
    thought: "BlogPosting",
    distilled: "Article",
    knowledge: "Article",
    blueprint: "TechArticle",
  },
}

const MEDIA_TYPE_MAP: Record<string, string> = {
  article: "Article",
  book: "Book",
  video: "VideoObject",
  podcast: "PodcastEpisode",
}

/** Reverse "Lastname, Firstname" → "Firstname Lastname" */
function parseAuthorName(raw: string): string {
  const parts = raw.split(",").map((s) => s.trim())
  return parts.length === 2 ? `${parts[1]} ${parts[0]}` : raw
}

function toPersonObject(name: string): object {
  return { "@type": "Person", name }
}

function resolveSchemaType(
  pageData: QuartzPluginData,
  options: JsonLdOptions,
  ldOverrides: Record<string, unknown>,
): string {
  // ld-type frontmatter has highest precedence
  if (typeof ldOverrides["type"] === "string") return ldOverrides["type"]

  const slug = pageData.slug ?? ""
  if (slug === "index") return "WebSite"
  if (slug.startsWith("tags/")) return "CollectionPage"
  if (slug.endsWith("/index")) return "WebPage"

  const tags = (pageData.frontmatter?.tags as string[] | undefined) ?? []
  for (const tag of tags) {
    if (options.tagTypeMap[tag]) return options.tagTypeMap[tag]
  }

  return options.defaultType
}

/**
 * Build the isBasedOn citation object from media-related frontmatter.
 * Only emitted when at least one of `media`, `media-url`, or `authors` is present.
 */
function buildIsBasedOn(fm: Record<string, unknown>): object | undefined {
  const media = fm["media"] as string | undefined
  const mediaUrl = fm["media-url"] as string | undefined
  const mediaType = fm["media-type"] as string | undefined
  const rawAuthors = fm["authors"] as string[] | string | undefined

  if (!media && !mediaUrl && !rawAuthors) return undefined

  const schemaType = mediaType
    ? (MEDIA_TYPE_MAP[mediaType.toLowerCase()] ?? "CreativeWork")
    : "CreativeWork"

  const authorList = rawAuthors
    ? (Array.isArray(rawAuthors) ? rawAuthors : [rawAuthors]).map((a) =>
        toPersonObject(parseAuthorName(a)),
      )
    : undefined

  const result: Record<string, unknown> = { "@type": schemaType }
  if (media) result["name"] = media
  if (mediaUrl) result["url"] = mediaUrl
  if (authorList) {
    result["author"] = authorList.length === 1 ? authorList[0] : authorList
  }

  return result
}

function resolveImageUrl(value: unknown, baseUrl: string): string | undefined {
  if (typeof value !== "string" || !value) return undefined
  if (value.startsWith("http://") || value.startsWith("https://")) return value
  const path = value.startsWith("/") ? value : `/${value}`
  return `${baseUrl}${path}`
}

function buildJsonLd(
  pageData: QuartzPluginData,
  cfg: GlobalConfiguration,
  options: JsonLdOptions,
  baseUrl: string,
): Record<string, unknown> {
  const fm = (pageData.frontmatter ?? {}) as Record<string, unknown>

  // Collect ld-* overrides, stripping the "ld-" prefix
  const ldOverrides: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(fm)) {
    if (k.startsWith("ld-")) ldOverrides[k.slice(3)] = v
  }

  const schemaType = resolveSchemaType(pageData, options, ldOverrides)
  const slug = pageData.slug ?? ""
  const pageUrl = `${baseUrl}/${slug}`

  // Publisher / author is always the site owner
  const ownerPerson: Record<string, unknown> = { "@type": "Person", ...options.author }

  // WebSite has a simpler shape
  if (schemaType === "WebSite") {
    const { type: _t, ...ldRest } = ldOverrides
    return stripUndefined({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: cfg.pageTitle,
      url: baseUrl,
      author: ownerPerson,
      ...ldRest,
    })
  }

  // CollectionPage / WebPage — minimal structured data
  if (schemaType === "CollectionPage" || schemaType === "WebPage") {
    const title = (fm["title"] as string | undefined) ?? ""
    const { type: _t, ...ldRest } = ldOverrides
    return stripUndefined({
      "@context": "https://schema.org",
      "@type": schemaType,
      name: title || undefined,
      url: pageUrl,
      author: ownerPerson,
      ...ldRest,
    })
  }

  // Article / BlogPosting / TechArticle and any custom type
  const title = (fm["title"] as string | undefined) ?? ""
  const description = pageData.description ?? undefined

  // Date parsing — frontmatter stores "YYYY-MM-DD HH:mm"
  const createdRaw = fm["created"] as string | undefined
  const modifiedRaw = fm["modified"] as string | undefined
  const datePublished = createdRaw ? new Date(createdRaw).toISOString() : undefined
  const dateModified = modifiedRaw ? new Date(modifiedRaw).toISOString() : datePublished

  // keywords = tags + frontmatter keywords (merged, deduplicated)
  const tags = (fm["tags"] as string[] | undefined) ?? []
  const fmKeywords = fm["keywords"] as string[] | string | undefined
  const extraKeywords = fmKeywords
    ? Array.isArray(fmKeywords)
      ? fmKeywords
      : [fmKeywords]
    : []
  const allKeywords = [...new Set([...tags, ...extraKeywords])]
  const keywords = options.includeTags && allKeywords.length > 0
    ? allKeywords.join(", ")
    : undefined

  const featuredImage = resolveImageUrl(fm["featured-image"], baseUrl)
  const isBasedOn = buildIsBasedOn(fm)

  const { type: _t, ...ldRest } = ldOverrides
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
    identifier: (fm["id"] as string | undefined) ?? undefined,
    isBasedOn,
    // ld-* overrides are applied last — highest precedence
    ...ldRest,
  })
}

/** Remove keys with undefined or null values for cleaner JSON output */
function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null))
}

export const JsonLd: QuartzEmitterPlugin<Partial<JsonLdOptions>> = (userOpts) => {
  const options: JsonLdOptions = {
    ...defaultOptions,
    ...userOpts,
    // Merge tagTypeMap shallowly so callers can extend defaults without replacing them
    tagTypeMap: { ...defaultOptions.tagTypeMap, ...(userOpts?.tagTypeMap ?? {}) },
    author: { ...defaultOptions.author, ...(userOpts?.author ?? {}) },
  }

  return {
    name: "JsonLd",

    // No files are written to disk — JSON-LD lives in each page's <head>
    async *emit(_ctx, _content, _resources) {},

    externalResources: (ctx) => {
      const cfg = ctx.cfg.configuration
      if (!cfg.baseUrl) return {}

      const baseUrl = `https://${cfg.baseUrl}`

      return {
        additionalHead: [
          (pageData: QuartzPluginData) => {
            const jsonLd = buildJsonLd(pageData, cfg, options, baseUrl)
            return (
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
              />
            )
          },
        ],
      }
    },
  }
}
