import { NextRequest, NextResponse } from 'next/server'
import { transformAffiliateUrl, ensureUrlProtocol } from '@/lib/utils/affiliate'

interface PreviewMetadata {
  title?: string
  description?: string
  image?: string
  price?: number
  currency?: string
  siteName?: string
  affiliatedUrl: string
  platformName: string
  isAffiliated: boolean
}

// User-agents that trigger rich link previews in ecommerce and social platforms
const CRAWLER_USER_AGENTS = [
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'Twitterbot/1.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Se requiere una URL válida.' },
        { status: 400 }
      )
    }

    const cleanUrl = ensureUrlProtocol(url)
    const affiliateInfo = transformAffiliateUrl(cleanUrl)

    const result: PreviewMetadata = {
      siteName: affiliateInfo.name,
      affiliatedUrl: affiliateInfo.affiliatedUrl,
      platformName: affiliateInfo.name,
      isAffiliated: affiliateInfo.isAffiliated,
    }

    let bestTitle: string | undefined = undefined
    let bestImage: string | undefined = undefined
    let bestPrice: number | undefined = undefined
    let bestDesc: string | undefined = undefined

    // Attempt fetching with crawler user-agents
    for (const ua of CRAWLER_USER_AGENTS) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4500)

      try {
        const response = await fetch(cleanUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': ua,
            'Accept':
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
            'Upgrade-Insecure-Requests': '1',
          },
          redirect: 'follow',
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const html = await response.text()

          // 1. JSON-LD parsing (Product schema, offers, images)
          const jsonLdMatches = html.matchAll(
            /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
          )
          for (const match of jsonLdMatches) {
            try {
              const parsed = JSON.parse(match[1].trim())
              const items = Array.isArray(parsed) ? parsed : [parsed]
              for (const item of items) {
                if (item['@type'] === 'Product' || item['name'] || item['image']) {
                  if (!bestTitle && item['name']) bestTitle = String(item['name'])
                  if (!bestImage) {
                    const img = item['image']
                    if (typeof img === 'string') bestImage = img
                    else if (Array.isArray(img) && typeof img[0] === 'string') bestImage = img[0]
                    else if (img && img.url) bestImage = String(img.url)
                  }
                  if (!bestPrice) {
                    const offers = item['offers']
                    if (offers) {
                      const p = Array.isArray(offers) ? offers[0]?.price : offers?.price
                      if (p) {
                        const parsedNum = parseFloat(String(p).replace(/[^0-9.]/g, ''))
                        if (!isNaN(parsedNum) && parsedNum > 0) bestPrice = parsedNum
                      }
                    }
                  }
                  if (!bestDesc && item['description']) bestDesc = String(item['description'])
                }
              }
            } catch {
              // Ignore invalid JSON-LD blocks
            }
          }

          // 2. Bidirectional Meta Tag Helper
          const getMetaTag = (propName: string): string | undefined => {
            const p1 = new RegExp(
              `<meta[^>]+(?:property|name)=["']${propName}["'][^>]+content=["']([^"']+)["']`,
              'i'
            )
            const p2 = new RegExp(
              `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${propName}["']`,
              'i'
            )
            const m1 = html.match(p1)
            if (m1 && m1[1]) return m1[1]
            const m2 = html.match(p2)
            if (m2 && m2[1]) return m2[1]
            return undefined
          }

          // 3. Title Extraction
          if (!bestTitle) {
            const ogTitle =
              getMetaTag('og:title') ||
              getMetaTag('twitter:title') ||
              getMetaTag('title') ||
              html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]

            if (
              ogTitle &&
              !ogTitle.toLowerCase().includes('robot check') &&
              !ogTitle.toLowerCase().includes('security check')
            ) {
              bestTitle = ogTitle
            }
          }

          // 4. Image Extraction
          if (!bestImage) {
            const rawImg =
              getMetaTag('og:image') ||
              getMetaTag('twitter:image') ||
              getMetaTag('image') ||
              html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i)?.[1]

            if (rawImg) {
              if (rawImg.startsWith('//')) {
                bestImage = `https:${rawImg}`
              } else if (rawImg.startsWith('/')) {
                try {
                  const base = new URL(cleanUrl)
                  bestImage = `${base.origin}${rawImg}`
                } catch {
                  bestImage = rawImg
                }
              } else {
                bestImage = rawImg
              }
            }
          }

          // 5. Price Extraction
          if (!bestPrice) {
            const priceMeta =
              getMetaTag('product:price:amount') ||
              getMetaTag('og:price:amount') ||
              getMetaTag('price')

            if (priceMeta) {
              const num = parseFloat(priceMeta.replace(/[^0-9.]/g, ''))
              if (!isNaN(num) && num > 0) bestPrice = num
            }
          }

          // Price regex in HTML tags (e.g. data-price or itemprop="price")
          if (!bestPrice) {
            const priceHtmlMatch =
              html.match(/(?:data-price|itemprop="price")=["']([0-9.,]+)["']/i) ||
              html.match(/"price":\s*"?([0-9.,]+)"?/i)
            if (priceHtmlMatch && priceHtmlMatch[1]) {
              const num = parseFloat(priceHtmlMatch[1].replace(/,/g, ''))
              if (!isNaN(num) && num > 0) bestPrice = num
            }
          }

          // If we found title and image, we don't need to try subsequent user-agents
          if (bestTitle && bestImage) {
            break
          }
        }
      } catch {
        clearTimeout(timeoutId)
      }
    }

    // Clean and decode strings
    if (bestTitle) {
      bestTitle = bestTitle
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim()

      // Clean common store title suffixes
      bestTitle = bestTitle
        .replace(/\s*[:|]\s*(Amazon|Mercado Libre|IKEA|Falabella|Booking|Apple|AliExpress).*$/i, '')
        .trim()

      result.title = bestTitle
    } else {
      // Fallback: extract title from URL path slug
      try {
        const urlObj = new URL(cleanUrl)
        const pathSegments = urlObj.pathname.split('/').filter(Boolean)
        if (pathSegments.length > 0) {
          const lastSegment = pathSegments[pathSegments.length - 1]
          if (lastSegment && lastSegment.length > 3) {
            const slugTitle = decodeURIComponent(lastSegment)
              .replace(/[-_]/g, ' ')
              .replace(/\b(dp|p|item|MCO|MLA|MLM)\b.*/i, '')
              .trim()
            if (slugTitle.length > 3) {
              result.title = slugTitle
            }
          }
        }
      } catch {
        // ignore
      }
    }

    if (bestImage) {
      result.image = bestImage.replace(/&amp;/g, '&')
    }

    if (bestPrice) {
      result.price = bestPrice
    }

    if (bestDesc) {
      result.description = bestDesc
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .slice(0, 300)
    }

    return NextResponse.json({
      success: true,
      metadata: result,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'No se pudo procesar el enlace.', details: String(error) },
      { status: 500 }
    )
  }
}
