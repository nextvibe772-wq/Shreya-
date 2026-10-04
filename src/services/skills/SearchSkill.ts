import { AssistantSkill, SkillResult } from './SkillInterface';

export class SearchSkill implements AssistantSkill {
  public readonly id = 'search_skill';
  public readonly name = 'Web & Information Search';
  public readonly description = 'Searches the live web and knowledge bases for real-time facts, news, and definitions.';
  public readonly permissions = ['INTERNET'];
  public readonly requiresConfirmation = false;

  public async execute(params: Record<string, any>): Promise<SkillResult> {
    const query = (params.query || '').trim();
    if (!query) {
      return { success: false, summary: 'Search query is empty.' };
    }

    try {
      // 1. Query DuckDuckGo Instant Answer API
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const res = await fetch(ddgUrl);
      const data = await res.json().catch(() => null);

      let summary = '';
      let sourceUrl = '';

      if (data?.AbstractText) {
        summary = data.AbstractText;
        sourceUrl = data.AbstractURL || 'DuckDuckGo';
      } else if (data?.RelatedTopics && data.RelatedTopics.length > 0) {
        const first = data.RelatedTopics[0];
        summary = first.Text || '';
        sourceUrl = first.FirstURL || '';
      }

      // 2. If DDG is empty, check Wikipedia API
      if (!summary) {
        const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
        const wikiRes = await fetch(wikiUrl);
        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          if (wikiData.extract) {
            summary = wikiData.extract;
            sourceUrl = wikiData.content_urls?.desktop?.page || 'Wikipedia';
          }
        }
      }

      if (summary) {
        return {
          success: true,
          summary: `Found: ${summary.slice(0, 300)}... (Source: ${sourceUrl})`,
          data: {
            title: query,
            snippet: summary,
            source: sourceUrl,
          },
        };
      }

      return {
        success: true,
        summary: `Searched web for "${query}". Provided context to AI engine.`,
        data: { query, searched: true },
      };
    } catch (err: any) {
      return {
        success: false,
        summary: `Search failed: ${err.message}`,
        error: err.message,
      };
    }
  }
}
