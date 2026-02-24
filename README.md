# 💰 Pay Per Crawl Worker

> **Cobra a los crawlers de IA por acceder a tu contenido.**  
> Implementación del protocolo HTTP 402 con Cloudflare Workers.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Josusanz/pay-per-crawl-worker)

## ¿Qué es esto?

Desde hace años, OpenAI, Anthropic, Google y Meta mandan bots a leer todo el contenido de Internet para entrenar sus modelos de IA. **Gratis. Sin pedir permiso.**

Cloudflare lanzó **Pay Per Crawl**: un sistema para cobrar a esos bots por cada visita, usando el código HTTP 402 (`Payment Required`), que llevaba 30 años sin usarse.

Este Worker implementa ese protocolo directamente en el edge de Cloudflare.

## ¿Cómo funciona?

Cada vez que un crawler de IA llega a tu web:
- Si no trae cabecera de pago → recibe un `402` con el precio
- Si trae `crawler-max-price` y acepta el precio → pasa y se registra el cobro
- Si está en tu lista de bloqueados → `403`
- Si está permitido gratis → pasa sin restricciones
- Si es un humano → pasa siempre gratis

## Instalación
```bash
git clone https://github.com/Josusanz/pay-per-crawl-worker.git
cd pay-per-crawl-worker
npm install
cp .dev.vars.example .dev.vars
npx wrangler dev
```

## Probar en local
```bash
# Crawler sin pago → 402
curl -i -H "User-Agent: GPTBot/1.0" http://localhost:8787/

# Crawler que acepta pagar → 200
curl -i -H "User-Agent: GPTBot/1.0" -H "crawler-max-price: USD 0.05" http://localhost:8787/

# Usuario humano → 200 gratis
curl -i http://localhost:8787/
```

## Deploy
```bash
npx wrangler deploy
```

## Configuración de crawlers

Edita `CRAWLER_RULES` en `wrangler.toml`:
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

## Crawlers soportados

| Crawler | Empresa |
|---------|---------|
| GPTBot, ChatGPT-User, OAI-SearchBot | OpenAI |
| ClaudeBot | Anthropic |
| Google-Extended, GoogleOther | Google |
| FacebookBot | Meta |
| Applebot-Extended | Apple |
| Amazonbot | Amazon |
| PerplexityBot | Perplexity AI |
| Bytespider | ByteDance/TikTok |
| YouBot, cohere-ai, Diffbot | Otros |

## Diferencia con el Pay Per Crawl oficial de Cloudflare

| | Este Worker | Cloudflare Pay Per Crawl |
|---|---|---|
| Disponibilidad | ✅ Ahora | 🔒 Private beta |
| Cobro real de dinero | ❌ | ✅ |
| Personalización | ✅ Total | ⚠️ Limitada |
| Coste | ✅ Gratis | Pendiente |

Úsalos juntos: este Worker para protección inmediata + [apuntarse al beta oficial](https://www.cloudflare.com/paypercrawl-signup/) para cobro real.

## Recursos

- [Cloudflare Pay Per Crawl docs](https://developers.cloudflare.com/ai-crawl-control/features/pay-per-crawl/)
- [Blog post de Cloudflare](https://blog.cloudflare.com/introducing-pay-per-crawl/)
- [Solicitar acceso al beta](https://www.cloudflare.com/paypercrawl-signup/)

## Licencia

MIT — creado con ❤️ desde el Valle Sagrado del Cusco, Perú. por [Josu Sanz](https://github.com/Josusanz/pay-per-crawl-worker)
