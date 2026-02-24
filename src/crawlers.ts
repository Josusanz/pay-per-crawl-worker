interface KnownCrawler { name: string; userAgentPatterns: string[]; company: string; }

export const KNOWN_AI_CRAWLERS: KnownCrawler[] = [
  { name: 'GPTBot', company: 'OpenAI', userAgentPatterns: ['GPTBot'] },
  { name: 'ChatGPT-User', company: 'OpenAI', userAgentPatterns: ['ChatGPT-User'] },
  { name: 'OAI-SearchBot', company: 'OpenAI', userAgentPatterns: ['OAI-SearchBot'] },
  { name: 'ClaudeBot', company: 'Anthropic', userAgentPatterns: ['ClaudeBot', 'Claude-Web'] },
  { name: 'Google-Extended', company: 'Google', userAgentPatterns: ['Google-Extended'] },
  { name: 'GoogleOther', company: 'Google', userAgentPatterns: ['GoogleOther'] },
  { name: 'FacebookBot', company: 'Meta', userAgentPatterns: ['FacebookBot', 'meta-externalagent'] },
  { name: 'Applebot-Extended', company: 'Apple', userAgentPatterns: ['Applebot-Extended'] },
  { name: 'Amazonbot', company: 'Amazon', userAgentPatterns: ['Amazonbot'] },
  { name: 'PerplexityBot', company: 'Perplexity', userAgentPatterns: ['PerplexityBot'] },
  { name: 'YouBot', company: 'You.com', userAgentPatterns: ['YouBot'] },
  { name: 'cohere-ai', company: 'Cohere', userAgentPatterns: ['cohere-ai'] },
  { name: 'Bytespider', company: 'ByteDance', userAgentPatterns: ['Bytespider'] },
  { name: 'Diffbot', company: 'Diffbot', userAgentPatterns: ['Diffbot'] },
];

export function getCrawlerName(userAgent: string): string | null {
  if (!userAgent) return null;
  for (const crawler of KNOWN_AI_CRAWLERS) {
    for (const pattern of crawler.userAgentPatterns) {
      if (userAgent.includes(pattern)) return crawler.name;
    }
  }
  return null;
}
