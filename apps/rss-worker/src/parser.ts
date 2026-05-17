import { XMLParser } from "fast-xml-parser";

export interface ParsedItem {
  guid: string;
  title?: string;
  link?: string;
  description?: string;
  content?: string;
  author?: string;
  publishedAt?: Date;
}

export interface ParsedFeed {
  title?: string;
  description?: string;
  siteUrl?: string;
  items: ParsedItem[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? undefined : d;
}

function text(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "object" && "#text" in (value as object)) {
    return String((value as Record<string, unknown>)["#text"]);
  }
  return String(value);
}

export function parseFeed(xml: string): ParsedFeed {
  const doc = parser.parse(xml) as Record<string, unknown>;

  // Atom
  if ("feed" in doc) {
    const feed = doc["feed"] as Record<string, unknown>;
    const entries = (
      Array.isArray(feed["entry"])
        ? feed["entry"]
        : feed["entry"]
          ? [feed["entry"]]
          : []
    ) as Record<string, unknown>[];

    return {
      title: text(feed["title"]),
      description: text(feed["subtitle"]),
      siteUrl: resolveAtomLink(feed["link"]),
      items: entries.map((e) => ({
        guid: text(e["id"]) ?? text(e["link"]) ?? Math.random().toString(36),
        title: text(e["title"]),
        link: resolveAtomLink(e["link"]),
        description: text(e["summary"]),
        content: text(e["content"]),
        author: resolveAtomAuthor(e["author"]),
        publishedAt: toDate(e["published"] ?? e["updated"]),
      })),
    };
  }

  // RSS 2.0 / RSS 1.0
  const rss = doc["rss"] as Record<string, unknown> | undefined;
  const rdf = doc["rdf:RDF"] as Record<string, unknown> | undefined;
  const root = rss ?? rdf;

  if (!root) return { items: [] };

  const channel = (root["channel"] ?? root) as Record<string, unknown>;
  const rawItems = (
    Array.isArray(channel["item"])
      ? channel["item"]
      : channel["item"]
        ? [channel["item"]]
        : []
  ) as Record<string, unknown>[];

  return {
    title: text(channel["title"]),
    description: text(channel["description"]),
    siteUrl: text(channel["link"]),
    items: rawItems.map((item) => ({
      guid:
        text(item["guid"]) ?? text(item["link"]) ?? Math.random().toString(36),
      title: text(item["title"]),
      link: text(item["link"]),
      description: text(item["description"]),
      content: text(item["content:encoded"]),
      author: text(item["author"]) ?? text(item["dc:creator"]),
      publishedAt: toDate(item["pubDate"] ?? item["dc:date"]),
    })),
  };
}

function resolveAtomLink(link: unknown): string | undefined {
  if (!link) return undefined;
  if (typeof link === "string") return link;
  if (Array.isArray(link)) {
    const alt = (link as Record<string, string>[]).find(
      (l) => l["@_rel"] === "alternate" || !l["@_rel"],
    );
    return alt?.["@_href"];
  }
  if (typeof link === "object") {
    return (link as Record<string, string>)["@_href"];
  }
  return undefined;
}

function resolveAtomAuthor(author: unknown): string | undefined {
  if (!author) return undefined;
  if (typeof author === "string") return author;
  if (typeof author === "object") {
    return text((author as Record<string, unknown>)["name"]);
  }
  return undefined;
}
