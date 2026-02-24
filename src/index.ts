import { Env, CrawlerConfig, CrawlerRule } from './types';
import { getCrawlerName } from './crawlers';
import { parsePrice, formatPrice, isPriceAcceptable } from './pricing';
import { log } from './logger';

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const FREE_PATHS = ['/robots.txt', '/sitemap.xml', '/security.txt', '/.well-known/security.txt', '/crawlers.json'];
    if (FREE_PATHS.includes(url.pathname)) return fetch(request);

    const userAgent = request.headers.get('User-Agent') || '';
    const crawlerName = getCrawlerName(userAgent);
    if (!crawlerName) return fetch(request);

    log('info', `Crawler detectado: ${crawlerName}`, { url: url.pathname });
    const rule = findRule(crawlerName, env);

    if (rule.action === 'allow') return fetch(request);
    if (rule.action === 'block') return new Response('Acceso denegado', { status: 403 });

    const configuredPrice = rule.price ?? parseFloat(env.DEFAULT_PRICE ?? '0.01');

    const maxPriceHeader = request.headers.get('crawler-max-price');
    if (maxPriceHeader) {
      const maxPrice = parsePrice(maxPriceHeader);
      if (maxPrice !== null && isPriceAcceptable(maxPrice, configuredPrice)) {
        const response = await fetch(request);
        return addChargedHeader(response, configuredPrice);
      }
      return paymentRequired(configuredPrice);
    }

    const exactPriceHeader = request.headers.get('crawler-exact-price');
    if (exactPriceHeader) {
      const exactPrice = parsePrice(exactPriceHeader);
      if (exactPrice !== null && exactPrice === configuredPrice) {
        const response = await fetch(request);
        return addChargedHeader(response, configuredPrice);
      }
      return paymentRequired(configuredPrice);
    }

    return paymentRequired(configuredPrice);
  },
};

function findRule(crawlerName: string, env: Env): CrawlerRule {
  if (env.CRAWLER_RULES) {
    try {
      const rules: CrawlerConfig = JSON.parse(env.CRAWLER_RULES);
      const match = rules.crawlers?.find(r => r.name.toLowerCase() === crawlerName.toLowerCase());
      if (match) return match;
      if (rules.default) {
        const rule: CrawlerRule = { name: 'default', action: rules.default };
        if (rules.defaultPrice !== undefined) rule.price = rules.defaultPrice;
        return rule;
      }
    } catch (_e) {}
  }
  return { name: crawlerName, action: 'charge' };
}

function paymentRequired(price: number): Response {
  return new Response(null, { status: 402, headers: { 'crawler-price': formatPrice(price) } });
}

function addChargedHeader(response: Response, price: number): Response {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('crawler-charged', formatPrice(price));
  return new Response(response.body, { status: response.status, headers: newHeaders });
}
