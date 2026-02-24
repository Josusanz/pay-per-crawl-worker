export interface Env {
  DEFAULT_PRICE?: string;
  CRAWLER_RULES?: string;
  LOG_LEVEL?: string;
}

export type CrawlerAction = 'allow' | 'charge' | 'block';

export interface CrawlerRule {
  name: string;
  action: CrawlerAction;
  price?: number;
}

export interface CrawlerConfig {
  default?: CrawlerAction;
  defaultPrice?: number;
  crawlers?: CrawlerRule[];
}
