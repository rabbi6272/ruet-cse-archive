import { generateCodeLibrarySitemap } from "@/lib/codelibrary/seo";

export async function GET() {
  try {
    const sitemapEntries = await generateCodeLibrarySitemap();
    // Remove the main page entry and keep only snippets
    const snippetEntries = sitemapEntries.slice(1);

    const rssItems = snippetEntries
      .slice(0, 50) // Latest 50 snippets
      .map(
        (entry) => `    <item>
      <title><![CDATA[${entry.title}]]></title>
      <description><![CDATA[${
        entry.description || "Code snippet from RUET CSE Archive"
      }]]></description>
      <link>${entry.url}</link>
      <guid isPermaLink="true">${entry.url}</guid>
      <pubDate>${new Date(entry.lastModified).toUTCString()}</pubDate>
      <category><![CDATA[Programming]]></category>
      <category><![CDATA[${entry.language || "Code"}]]></category>
      <dc:creator><![CDATA[${
        entry.author ? `Roll: ${entry.author}` : "RUET CSE Student"
      }]]></dc:creator>
    </item>`
      )
      .join("\n");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[RUET CSE Code Library - Latest Programming Solutions]]></title>
    <description><![CDATA[Latest code snippets, algorithms, and programming solutions from RUET Computer Science & Engineering students]]></description>
    <link>https://csearchive.vercel.app/codelibrary</link>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <ttl>1440</ttl>
    <generator>RUET CSE Archive</generator>
    <webMaster>admin@csearchive.vercel.app (RUET CSE Archive)</webMaster>
    <managingEditor>admin@csearchive.vercel.app (RUET CSE Archive)</managingEditor>
    <category><![CDATA[Programming]]></category>
    <category><![CDATA[Computer Science]]></category>
    <category><![CDATA[Education]]></category>
    <atom:link href="https://csearchive.vercel.app/codelibrary/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>https://csearchive.vercel.app/icon.png</url>
      <title><![CDATA[RUET CSE Code Library]]></title>
      <link>https://csearchive.vercel.app/codelibrary</link>
      <width>512</width>
      <height>512</height>
    </image>
${rssItems}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Error generating RSS feed:", error);
    return new Response("Error generating RSS feed", { status: 500 });
  }
}
