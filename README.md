# 💰 Pay Per Crawl Worker

> **Protege tu contenido de los crawlers de IA e implementa el protocolo HTTP 402.**
> Cloudflare Worker listo para desplegar en 5 minutos.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Josusanz/pay-per-crawl-worker)

---

## Por qué existe esto

Desde hace años, OpenAI, Anthropic, Google y Meta mandan bots a leer todo el contenido de Internet para entrenar sus modelos de IA. **Gratis. Sin pedir permiso.**

Cloudflare rescató el código HTTP 402 (`Payment Required`), que llevaba 30 años en el estándar sin usarse, para crear **Pay Per Crawl**: un protocolo para que los propietarios de contenido puedan cobrar a esos bots por cada visita.

**Este repositorio importa por tres razones:**

**1. El protocolo necesita masa crítica.**
Para que HTTP 402 funcione como ecosistema necesita que miles de sitios lo implementen. Cada deploy de este Worker es un voto a favor del protocolo.

**2. Hoy bloqueas. Mañana cobras.**
El cobro real aún no existe porque las empresas de IA no han implementado el lado del pago. Cuando lo hagan, los sitios que ya hablen el protocolo cobrarán desde el primer día. Los que no lo tengan implementado se quedarán fuera.

**3. Es una postura, no solo una herramienta.**
Desplegar este Worker dice: *mi contenido tiene valor y no es gratis*. Aunque hoy no llegue dinero, establece un precedente técnico y legal. Es la diferencia entre ceder el contenido en silencio o dejar constancia de que no se cedió gratis.

> Una apuesta por un Internet donde los creadores de contenido tengan agencia sobre cómo se usa su trabajo.

---

## ¿Cómo funciona?

Cada vez que un crawler de IA llega a tu web:

- Si no trae cabecera de pago → recibe un `402` con el precio
- Si trae `crawler-max-price` y acepta el precio → pasa y se registra el cobro
- Si está en tu lista de bloqueados → `403`
- Si está permitido gratis → pasa sin restricciones
- Si es un humano → pasa siempre gratis

---

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

---

## Configuración de crawlers

Crea un archivo `crawler-rules.json` basándote en el ejemplo `crawler-rules.example.json`:

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

Las acciones posibles son:

| Acción | Efecto |
|--------|--------|
| `charge` | Exige cabecera de pago. Sin ella, responde `402` con el precio |
| `allow` | Deja pasar siempre, sin cobrar |
| `block` | Bloquea siempre con `403` |

### Aplicar las reglas

**En desarrollo** — pon el JSON como string en `.dev.vars`:

```bash
# Convierte el JSON a una línea y ponlo en .dev.vars
echo "CRAWLER_RULES=$(cat crawler-rules.json | tr -d '\n')" >> .dev.vars
```

**En producción** — usa un secret de Wrangler:

```bash
wrangler secret put CRAWLER_RULES <<< "$(cat crawler-rules.json | tr -d '\n')"
```

---

## Crawlers soportados

| Crawler | Empresa | Acción por defecto |
|---------|---------|-------------------|
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

> Los crawlers de búsqueda tradicionales (Googlebot, Bingbot) no están en esta lista y siempre pasan gratis para no afectar el SEO.

---

## Diferencia con el Pay Per Crawl oficial de Cloudflare

Existen dos opciones para implementar Pay Per Crawl: este Worker (open source, desplegable hoy) y el servicio oficial de Cloudflare (aún en beta privada). No son competidores — son complementarios.

| | Este Worker | Cloudflare Pay Per Crawl |
|---|---|---|
| Disponibilidad | ✅ Ahora mismo | 🔒 Private beta |
| Cobro real de dinero | ❌ Protocolo sin cobro | ✅ Cobro gestionado por Cloudflare |
| Personalización | ✅ Total (tú controlas todo) | ⚠️ Limitada |
| Coste | ✅ Gratis (Workers free tier) | ⏳ Por anunciar |

**Recomendación:** usa este Worker ahora para protección inmediata + [apúntate al beta oficial](https://www.cloudflare.com/paypercrawl-signup/) para cuando esté disponible el cobro real.

---

## ¿Está este Worker preparado para el cobro real?

Sí, casi por completo. Cuando Cloudflare lance el sistema de pagos, el flujo será:

```
Tu Worker (HTTP 402)
       ↕
Cloudflare como intermediario financiero
       ↕
OpenAI / Anthropic / Google pagan a Cloudflare
       ↕
Cloudflare te transfiere el dinero a ti
```

Cloudflare actúa como el banco en el medio: negocia con las empresas de IA, gestiona los pagos y te paga a ti. No tienes que gestionar pagos directamente.

### Qué tiene que pasar para que funcione

Tres partes tienen que estar listas simultáneamente:

| Parte | Estado actual |
|---|---|
| Este Worker | ✅ Listo — ya habla el protocolo correctamente |
| Cloudflare Pay Per Crawl | 🔒 Beta privada — pendiente de apertura pública |
| OpenAI/Anthropic/etc. pagando | ❌ Los crawlers aún no envían cabeceras de pago reales |

### Por qué este Worker ya está listo

El protocolo HTTP 402 ya está implementado correctamente:

- Responde `402` con `crawler-price` cuando el crawler no paga
- Acepta `crawler-max-price` (flujo proactivo) y `crawler-exact-price` (flujo reactivo)
- Añade `crawler-charged` en la respuesta cuando se acepta el pago

Lo que Cloudflare añadirá es su capa de verificación financiera: cuando un crawler envíe las cabeceras de pago, Cloudflare verificará que el pago es real antes de que llegue a tu Worker. La lógica del Worker no cambia.

### Qué habrá que hacer cuando Cloudflare lo lance

1. Activar Pay Per Crawl en el dashboard de Cloudflare (un click)
2. Conectar tu cuenta de pagos
3. El Worker ya funciona — no hay que tocar código

### El único riesgo

Que Cloudflare ajuste algún detalle del protocolo (nombres de cabeceras, formato del precio) antes del lanzamiento final. La especificación todavía no es definitiva. Si eso ocurre, el cambio en este repo será mínimo y localizado en `src/pricing.ts`.

---

## Estructura del proyecto

```
pay-per-crawl-worker/
├── src/
│   ├── index.ts          # Lógica principal del Worker
│   ├── crawlers.ts       # Lista de crawlers de IA conocidos
│   ├── pricing.ts        # Parsing y validación de precios
│   ├── logger.ts         # Sistema de logs estructurados
│   └── types.ts          # Tipos TypeScript
├── crawler-rules.example.json  # Ejemplo de reglas de configuración
├── .dev.vars.example     # Variables de entorno para desarrollo local
├── wrangler.toml         # Configuración de Cloudflare Workers
├── package.json
└── tsconfig.json
```

---

## Recursos

- [Cloudflare Pay Per Crawl docs](https://developers.cloudflare.com/ai-crawl-control/features/pay-per-crawl/)
- [Blog post de Cloudflare](https://blog.cloudflare.com/introducing-pay-per-crawl/)
- [Solicitar acceso al beta](https://www.cloudflare.com/paypercrawl-signup/)

---

## Contribuir

PRs bienvenidos. Si encuentras un nuevo crawler de IA que no está en la lista, abre un issue o PR editando `src/crawlers.ts`.

---

## Licencia

MIT — creado con ❤️ desde el Valle Sagrado del Cusco, Perú. por [Josu Sanz](https://github.com/Josusanz/pay-per-crawl-worker)
