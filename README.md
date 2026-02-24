# 💰 Pay Per Crawl Worker

> **Protect your content from AI crawlers and implement the HTTP 402 protocol.**
> Cloudflare Worker ready to deploy in 5 minutes.

**[→ Live Demo](https://pay-per-crawl-demo.license-proxy.workers.dev)** · [![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Josusanz/pay-per-crawl-worker)

---

## Why this exists

For years, OpenAI, Anthropic, Google and Meta have been sending bots to scrape the entire Internet to train their AI models. **For free. Without asking permission.**

Cloudflare revived HTTP 402 (`Payment Required`) — a status code that had been sitting unused in the standard for 30 years — to create **Pay Per Crawl**: a protocol that lets content owners charge those bots for every visit.

**This repository matters for three reasons:**

**1. The protocol needs critical mass.**
For HTTP 402 to work as an ecosystem, thousands of sites need to implement it. Every deploy of this Worker is a vote in favor of the protocol.

**2. Today you block. Tomorrow you charge.**
Real payments don't exist yet because AI companies haven't implemented the paying side. When they do, sites that already speak the protocol will start earning on day one. Those that don't will be left out.

**3. It's a stance, not just a tool.**
Deploying this Worker sends a message: *my content has value and it's not free*. Even if no money arrives today, it establishes a technical and legal precedent. It's the difference between silently giving away your content or putting on record that you didn't.

> A bet on an Internet where content creators have agency over how their work is used.

---

## How it works

Every time an AI crawler hits your site:

- No payment header → receives `402` with the price
- Sends `crawler-max-price` and accepts the price → passes through, charge is recorded
- On your blocklist → `403`
- On your allowlist → passes through for free
- Human visitor → always passes through for free

---

## Installation

```bash
git clone https://github.com/Josusanz/pay-per-crawl-worker.git
cd pay-per-crawl-worker
npm install
cp .dev.vars.example .dev.vars
npx wrangler dev
```

## Test locally

```bash
# Crawler without payment → 402
curl -i -H "User-Agent: GPTBot/1.0" http://localhost:8787/

# Crawler willing to pay → 200
curl -i -H "User-Agent: GPTBot/1.0" -H "crawler-max-price: USD 0.05" http://localhost:8787/

# Human visitor → 200 free
curl -i http://localhost:8787/
```

## Deploy

```bash
npx wrangler deploy
```

---

## Crawler configuration

Create a `crawler-rules.json` file based on the `crawler-rules.example.json` template:

```json
{
  "default": "charge",
  "defaultPrice": 0.01,
  "crawlers": [
    { "name": "Google-Extended", "action": "allow" },
    { "name": "Bytespider", "action": "block" },
    { "name": "GPTBot", "action": "charge", "price": 0.01 },
    { "name": "ClaudeBot", "action": "charge", "price": 0.05 }
  ]
}
```

Available actions:

| Action | Effect |
|--------|--------|
| `charge` | Requires a payment header. Without it, responds `402` with the price |
| `allow` | Always lets through, no charge |
| `block` | Always blocks with `403` |

### Applying the rules

**Development** — add the JSON as a string to `.dev.vars`:

```bash
echo "CRAWLER_RULES=$(cat crawler-rules.json | tr -d '\n')" >> .dev.vars
```

**Production** — use a Wrangler secret:

```bash
wrangler secret put CRAWLER_RULES <<< "$(cat crawler-rules.json | tr -d '\n')"
```

---

## Supported crawlers

| Crawler | Company | Default action |
|---------|---------|----------------|
| GPTBot | OpenAI | `charge` |
| ChatGPT-User | OpenAI | `charge` |
| OAI-SearchBot | OpenAI | `charge` |
| ClaudeBot | Anthropic | `charge` |
| Google-Extended | Google | `charge` |
| GoogleOther | Google | `charge` |
| FacebookBot | Meta | `charge` |
| Applebot-Extended | Apple | `charge` |
| Amazonbot | Amazon | `charge` |
| PerplexityBot | Perplexity AI | `charge` |
| YouBot | You.com | `charge` |
| cohere-ai | Cohere | `charge` |
| Bytespider | ByteDance/TikTok | `charge` |
| AI2Bot | Allen Institute | `charge` |
| Diffbot | Diffbot | `charge` |

> Traditional search crawlers (Googlebot, Bingbot) are not on this list and always pass through for free so your SEO is not affected.

---

## Difference from Cloudflare's official Pay Per Crawl

There are two ways to implement Pay Per Crawl: this Worker (open source, deployable today) and Cloudflare's official service (still in private beta). They are not competitors — they are complementary.

| | This Worker | Cloudflare Pay Per Crawl |
|---|---|---|
| Availability | ✅ Right now | 🔒 Private beta |
| Real money collection | ❌ Protocol only, no payments | ✅ Payments managed by Cloudflare |
| Customization | ✅ Full control | ⚠️ Limited |
| Cost | ✅ Free (Workers free tier) | ⏳ To be announced |

**Recommendation:** use this Worker now for immediate protection + [sign up for the official beta](https://www.cloudflare.com/paypercrawl-signup/) for when real payments are available.

---

## Is this Worker ready for real payments?

Yes, almost entirely. When Cloudflare launches its payment system, the flow will be:

```
Your Worker (HTTP 402)
       ↕
Cloudflare as financial intermediary
       ↕
OpenAI / Anthropic / Google pay Cloudflare
       ↕
Cloudflare transfers the money to you
```

Cloudflare acts as the bank in the middle: it negotiates with AI companies, handles the payments, and pays you. You don't manage payments directly.

### What needs to happen for it to work

Three pieces need to be ready at the same time:

| Piece | Current status |
|---|---|
| This Worker | ✅ Ready — already speaks the protocol correctly |
| Cloudflare Pay Per Crawl | 🔒 Private beta — pending public launch |
| OpenAI/Anthropic/etc. paying | ❌ Crawlers don't send real payment headers yet |

### Why this Worker is already ready

The HTTP 402 protocol is fully implemented:

- Responds `402` with `crawler-price` when the crawler doesn't pay
- Accepts `crawler-max-price` (proactive flow) and `crawler-exact-price` (reactive flow)
- Adds `crawler-charged` to the response when a payment is accepted

What Cloudflare will add is a financial verification layer: when a crawler sends payment headers, Cloudflare will verify the payment is real before the request reaches your Worker. The Worker logic doesn't change.

### What you'll need to do when Cloudflare launches

1. Enable Pay Per Crawl in the Cloudflare dashboard (one click)
2. Connect your payment account
3. The Worker already works — no code changes needed

### The only risk

Cloudflare may adjust protocol details (header names, price format) before the final launch. The spec is not yet definitive. If that happens, the change in this repo will be minimal and contained in `src/pricing.ts`.

---

## Project structure

```
pay-per-crawl-worker/
├── src/
│   ├── index.ts          # Main Worker logic
│   ├── crawlers.ts       # Known AI crawlers database
│   ├── pricing.ts        # Price parsing and validation
│   ├── logger.ts         # Structured logging system
│   └── types.ts          # TypeScript types
├── crawler-rules.example.json  # Example crawler rules config
├── .dev.vars.example     # Local development environment variables
├── wrangler.toml         # Cloudflare Workers configuration
├── package.json
└── tsconfig.json
```

---

## Resources

- [Cloudflare Pay Per Crawl docs](https://developers.cloudflare.com/ai-crawl-control/features/pay-per-crawl/)
- [Cloudflare blog post](https://blog.cloudflare.com/introducing-pay-per-crawl/)
- [Sign up for the beta](https://www.cloudflare.com/paypercrawl-signup/)

---

## Contributing

PRs welcome. If you find a new AI crawler not on the list, open an issue or PR editing `src/crawlers.ts`.

---

## License

MIT — creado con ❤️ desde el Valle Sagrado del Cusco, Perú. por [Josu Sanz](https://github.com/Josusanz/pay-per-crawl-worker)
