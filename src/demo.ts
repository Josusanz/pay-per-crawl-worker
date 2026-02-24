import { getCrawlerName } from './crawlers';
import { parsePrice, formatPrice, isPriceAcceptable } from './pricing';

interface TestResult {
  requestHeaders: Record<string, string>;
  status: number;
  statusText: string;
  responseHeaders: Record<string, string>;
  note: string;
}

const DEMO_PRICE = 0.01;

const CRAWLER_USER_AGENTS: Record<string, string> = {
  Human:             'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
  GPTBot:            'GPTBot/1.0 (+https://openai.com/gptbot)',
  ClaudeBot:         'ClaudeBot/1.0 (+https://anthropic.com/claude-web)',
  'Google-Extended': 'Google-Extended/1.0',
  FacebookBot:       'FacebookBot/1.0 (+https://www.facebook.com/externalhit_uatext.php)',
  Bytespider:        'Bytespider/1.0 (+https://zhanzhang.toutiao.com/crawler_en)',
  PerplexityBot:     'PerplexityBot/1.0 (+https://www.perplexity.ai/perplexitybot)',
  Amazonbot:         'Amazonbot/0.1 (+https://developer.amazon.com/support/amazonbot)',
};

function simulate402(userAgent: string, action: string): TestResult {
  const requestHeaders: Record<string, string> = { 'User-Agent': userAgent };

  if (action === 'max-price') requestHeaders['crawler-max-price'] = formatPrice(DEMO_PRICE);
  if (action === 'exact-price') requestHeaders['crawler-exact-price'] = formatPrice(DEMO_PRICE);

  const crawlerName = getCrawlerName(userAgent);

  if (!crawlerName) {
    return {
      requestHeaders,
      status: 200,
      statusText: 'OK',
      responseHeaders: { 'content-type': 'text/html' },
      note: 'Not a known AI crawler. Passes through freely.',
    };
  }

  if (action === 'max-price') {
    const maxPrice = parsePrice(requestHeaders['crawler-max-price']);
    if (maxPrice !== null && isPriceAcceptable(maxPrice, DEMO_PRICE)) {
      return {
        requestHeaders,
        status: 200,
        statusText: 'OK',
        responseHeaders: { 'crawler-charged': formatPrice(DEMO_PRICE), 'content-type': 'text/html' },
        note: `Payment accepted. Offered ${formatPrice(maxPrice)}, price is ${formatPrice(DEMO_PRICE)}. Access granted.`,
      };
    }
  }

  if (action === 'exact-price') {
    const exactPrice = parsePrice(requestHeaders['crawler-exact-price']);
    if (exactPrice !== null && Math.abs(exactPrice - DEMO_PRICE) < 0.00001) {
      return {
        requestHeaders,
        status: 200,
        statusText: 'OK',
        responseHeaders: { 'crawler-charged': formatPrice(DEMO_PRICE), 'content-type': 'text/html' },
        note: `Exact price matched (${formatPrice(DEMO_PRICE)}). Access granted.`,
      };
    }
  }

  return {
    requestHeaders,
    status: 402,
    statusText: 'Payment Required',
    responseHeaders: { 'crawler-price': formatPrice(DEMO_PRICE) },
    note: action === 'none'
      ? 'No payment header sent. Access denied.'
      : 'Payment header present but insufficient or invalid.',
  };
}

function renderPage(): string {
  const crawlerButtons = Object.keys(CRAWLER_USER_AGENTS)
    .map(name => `<button class="crawler-btn" data-crawler="${name}">${name === 'Human' ? '👤 ' + name : name}</button>`)
    .join('\n        ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pay Per Crawl Worker — Live Demo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:       #0A0F1C;
      --surface:  #1E293B;
      --inset:    #0F172A;
      --border:   #334155;
      --cyan:     #22D3EE;
      --cyan-dim: #0E7490;
      --green:    #4ADE80;
      --red:      #F87171;
      --text:     #E2E8F0;
      --muted:    #94A3B8;
      --dim:      #64748B;
      --mono:     'JetBrains Mono', 'Fira Code', monospace;
      --sans:     'Inter', system-ui, sans-serif;
      --r:        8px;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--sans);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .container {
      width: 100%;
      max-width: 880px;
      padding: 56px 24px 80px;
      display: flex;
      flex-direction: column;
      gap: 44px;
    }

    /* ── Header ── */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: color-mix(in srgb, var(--cyan) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--cyan) 25%, transparent);
      color: var(--cyan);
      font-family: var(--mono);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .1em;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 20px;
      width: fit-content;
      margin-bottom: 16px;
    }

    h1 {
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      font-family: var(--mono);
      font-weight: 700;
      line-height: 1.15;
      letter-spacing: -.02em;
      margin-bottom: 14px;
    }

    h1 em { color: var(--cyan); font-style: normal; }

    .subtitle {
      color: var(--muted);
      font-size: 16px;
      line-height: 1.65;
      max-width: 600px;
    }

    /* ── Labels ── */
    .label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: var(--dim);
      margin-bottom: 12px;
      font-family: var(--mono);
    }

    /* ── Buttons ── */
    .btn-row { display: flex; flex-wrap: wrap; gap: 8px; }

    .crawler-btn, .action-btn {
      font-family: var(--mono);
      font-size: 12px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: var(--r);
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--muted);
      cursor: pointer;
      transition: border-color .15s, color .15s, background .15s;
    }

    .crawler-btn:hover, .action-btn:hover {
      border-color: var(--cyan-dim);
      color: var(--text);
    }

    .crawler-btn.active {
      border-color: var(--cyan);
      background: color-mix(in srgb, var(--cyan) 10%, var(--surface));
      color: var(--cyan);
    }

    .action-btn { background: var(--inset); }
    .action-btn.active { border-color: var(--cyan); color: var(--cyan); }

    /* ── Terminals ── */
    .terminal-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    @media (max-width: 640px) { .terminal-grid { grid-template-columns: 1fr; } }

    .terminal {
      background: var(--inset);
      border: 1px solid var(--border);
      border-radius: var(--r);
      overflow: hidden;
    }

    .t-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 14px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
    }

    .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--border); }
    .dot-r { background: #FF5F57; }
    .dot-y { background: #FFBD2E; }
    .dot-g { background: #28CA41; }

    .t-title {
      font-family: var(--mono);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: var(--dim);
      margin-left: 4px;
    }

    .t-body {
      padding: 18px 16px;
      font-family: var(--mono);
      font-size: 13px;
      line-height: 1.8;
      min-height: 130px;
    }

    .t-line { display: flex; gap: 6px; align-items: baseline; flex-wrap: wrap; }
    .t-key  { color: var(--cyan); white-space: nowrap; flex-shrink: 0; }
    .t-sep  { color: var(--border); flex-shrink: 0; }
    .t-val  { color: var(--text); word-break: break-all; }

    .t-status-200 { color: var(--green); font-weight: 700; }
    .t-status-402 { color: var(--red);   font-weight: 700; }

    .t-note {
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid var(--border);
      color: var(--dim);
      font-size: 12px;
      line-height: 1.5;
    }

    .t-empty {
      color: var(--border);
      font-family: var(--mono);
      font-size: 13px;
    }

    /* ── Spinner ── */
    .spin {
      display: inline-block;
      width: 14px; height: 14px;
      border: 2px solid var(--border);
      border-top-color: var(--cyan);
      border-radius: 50%;
      animation: spin .6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Footer ── */
    footer {
      width: 100%;
      max-width: 880px;
      padding: 24px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: center;
    }

    footer a {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--muted);
      text-decoration: none;
      font-size: 13px;
      font-family: var(--mono);
      transition: color .15s;
    }

    footer a:hover { color: var(--cyan); }
    footer svg { width: 18px; height: 18px; fill: currentColor; }
  </style>
</head>
<body>
  <div class="container">

    <header>
      <div class="badge">HTTP 402 · Live Demo</div>
      <h1>Pay Per Crawl<br><em>Worker</em></h1>
      <p class="subtitle">
        A Cloudflare Worker that intercepts AI crawler requests and responds with
        HTTP&nbsp;402 unless a valid payment header is sent.
        Pick a visitor and a payment action to see the protocol in action.
      </p>
    </header>

    <section>
      <p class="label">1 — Select visitor</p>
      <div class="btn-row" id="crawler-grid">
        ${crawlerButtons}
      </div>
    </section>

    <section>
      <p class="label">2 — Payment header</p>
      <div class="btn-row" id="action-row">
        <button class="action-btn active" data-action="none">No payment header</button>
        <button class="action-btn" data-action="max-price">crawler-max-price: USD 0.01</button>
        <button class="action-btn" data-action="exact-price">crawler-exact-price: USD 0.01</button>
      </div>
    </section>

    <section>
      <p class="label">3 — Protocol exchange</p>
      <div class="terminal-grid">
        <div class="terminal">
          <div class="t-header">
            <div class="dot dot-r"></div>
            <div class="dot dot-y"></div>
            <div class="dot dot-g"></div>
            <span class="t-title">Request</span>
          </div>
          <div class="t-body" id="req-block">
            <span class="t-empty">← select a visitor above</span>
          </div>
        </div>
        <div class="terminal">
          <div class="t-header">
            <div class="dot dot-r"></div>
            <div class="dot dot-y"></div>
            <div class="dot dot-g"></div>
            <span class="t-title">Response</span>
          </div>
          <div class="t-body" id="res-block">
            <span class="t-empty">← select a visitor above</span>
          </div>
        </div>
      </div>
    </section>

  </div>

  <footer>
    <a href="https://github.com/Josusanz/pay-per-crawl-worker" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
      </svg>
      github.com/Josusanz/pay-per-crawl-worker
    </a>
  </footer>

  <script>
    let crawler = null;
    let action = 'none';

    const reqBlock = document.getElementById('req-block');
    const resBlock = document.getElementById('res-block');

    document.getElementById('crawler-grid').addEventListener('click', e => {
      const btn = e.target.closest('.crawler-btn');
      if (!btn) return;
      document.querySelectorAll('.crawler-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      crawler = btn.dataset.crawler;
      run();
    });

    document.getElementById('action-row').addEventListener('click', e => {
      const btn = e.target.closest('.action-btn');
      if (!btn) return;
      document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      action = btn.dataset.action;
      if (crawler) run();
    });

    async function run() {
      reqBlock.innerHTML = resBlock.innerHTML = '<span class="spin"></span>';
      try {
        const url = new URL('/api/test', location.origin);
        url.searchParams.set('crawler', crawler);
        url.searchParams.set('action', action);
        const res = await fetch(url);
        render(await res.json());
      } catch {
        const err = '<span style="color:var(--red)">Network error</span>';
        reqBlock.innerHTML = resBlock.innerHTML = err;
      }
    }

    function headers(obj) {
      return Object.entries(obj).map(([k, v]) =>
        \`<div class="t-line">
          <span class="t-key">\${esc(k)}</span>
          <span class="t-sep">:</span>
          <span class="t-val">\${esc(v)}</span>
        </div>\`
      ).join('');
    }

    function render(d) {
      reqBlock.innerHTML = headers(d.requestHeaders);

      const sc = d.status === 200 ? 't-status-200' : 't-status-402';
      resBlock.innerHTML =
        \`<div class="t-line">
          <span class="t-key">Status</span>
          <span class="t-sep">:</span>
          <span class="t-val \${sc}">\${esc(d.status + ' ' + d.statusText)}</span>
        </div>\` +
        headers(d.responseHeaders) +
        \`<div class="t-note">\${esc(d.note)}</div>\`;
    }

    function esc(s) {
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
  </script>
</body>
</html>`;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/') {
      return new Response(renderPage(), {
        headers: { 'content-type': 'text/html;charset=UTF-8' },
      });
    }

    if (url.pathname === '/api/test') {
      const crawlerKey = url.searchParams.get('crawler') ?? 'Human';
      const action     = url.searchParams.get('action')  ?? 'none';
      const userAgent  = CRAWLER_USER_AGENTS[crawlerKey] ?? CRAWLER_USER_AGENTS['Human'];
      const result     = simulate402(userAgent, action);

      return new Response(JSON.stringify(result), {
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
