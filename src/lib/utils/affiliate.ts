/**
 * Utilidades para Enlaces de Tiendas y Monetización de Tándem
 * Funciona de forma 100% directa y transparente por defecto.
 * La inyección de afiliados solo se activa si se configuran variables de entorno.
 */

export interface AffiliateStoreInfo {
  platformId: string
  name: string
  domain: string
  color: string
  textColor: string
  bgColor: string
  borderColor: string
  badgeLabel: string
  iconName: string
  isAffiliated: boolean
  affiliatedUrl: string
  originalUrl: string
  affiliateTag?: string
}

export const AFFILIATE_DISCLOSURE = {
  short: 'Enlaces guardados para consultar precios y disponibilidad en tiendas oficiales.',
  full: 'Guarda enlaces de tus tiendas favoritas para cotizar juntos y acceder directamente al producto cuando alcancen su meta ✨',
  affiliateActive: 'Al comprar a través de estos enlaces, Tándem puede recibir una pequeña comisión sin ningún costo adicional para ustedes ✨',
  complianceBadge: 'Tienda Oficial',
}

interface PlatformConfig {
  id: string
  name: string
  domains: string[]
  paramName?: string
  envVarKey?: string
  color: string
  textColor: string
  bgColor: string
  borderColor: string
  badgeLabel: string
  iconName: string
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'amazon',
    name: 'Amazon',
    domains: ['amazon.', 'amzn.to', 'amzn.eu', 'amzn.in'],
    paramName: 'tag',
    envVarKey: 'NEXT_PUBLIC_AMAZON_AFFILIATE_TAG',
    color: '#FF9900',
    textColor: '#FF9900',
    bgColor: 'rgba(255, 153, 0, 0.12)',
    borderColor: 'rgba(255, 153, 0, 0.3)',
    badgeLabel: 'Amazon',
    iconName: 'ShoppingBag',
  },
  {
    id: 'mercadolibre',
    name: 'MercadoLibre',
    domains: ['mercadolibre.', 'mercadolivre.', 'meli.'],
    paramName: 'matt_tool',
    envVarKey: 'NEXT_PUBLIC_MERCADOLIBRE_AFFILIATE_ID',
    color: '#FFE600',
    textColor: '#E5B800',
    bgColor: 'rgba(255, 230, 0, 0.12)',
    borderColor: 'rgba(255, 230, 0, 0.3)',
    badgeLabel: 'MercadoLibre',
    iconName: 'ShoppingBag',
  },
  {
    id: 'aliexpress',
    name: 'AliExpress',
    domains: ['aliexpress.com', 'aliexpress.us', 's.click.aliexpress.com'],
    paramName: 'aff_fcid',
    envVarKey: 'NEXT_PUBLIC_ALIEXPRESS_AFFILIATE_TAG',
    color: '#FF4747',
    textColor: '#FF4747',
    bgColor: 'rgba(255, 71, 71, 0.12)',
    borderColor: 'rgba(255, 71, 71, 0.3)',
    badgeLabel: 'AliExpress',
    iconName: 'Package',
  },
  {
    id: 'booking',
    name: 'Booking.com',
    domains: ['booking.com'],
    paramName: 'aid',
    envVarKey: 'NEXT_PUBLIC_BOOKING_AFFILIATE_ID',
    color: '#003580',
    textColor: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    badgeLabel: 'Booking',
    iconName: 'Hotel',
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    domains: ['airbnb.'],
    paramName: 'af',
    envVarKey: 'NEXT_PUBLIC_AIRBNB_AFFILIATE_ID',
    color: '#FF5A5F',
    textColor: '#FF5A5F',
    bgColor: 'rgba(255, 90, 95, 0.12)',
    borderColor: 'rgba(255, 90, 95, 0.3)',
    badgeLabel: 'Airbnb',
    iconName: 'Home',
  },
  {
    id: 'ikea',
    name: 'IKEA',
    domains: ['ikea.com'],
    paramName: 'ref',
    envVarKey: 'NEXT_PUBLIC_IKEA_AFFILIATE_ID',
    color: '#0058A3',
    textColor: '#60a5fa',
    bgColor: 'rgba(0, 88, 163, 0.15)',
    borderColor: 'rgba(0, 88, 163, 0.35)',
    badgeLabel: 'IKEA',
    iconName: 'Home',
  },
  {
    id: 'falabella',
    name: 'Falabella',
    domains: ['falabella.com', 'linio.com'],
    paramName: 'utm_partner',
    envVarKey: 'NEXT_PUBLIC_FALABELLA_AFFILIATE_ID',
    color: '#A4C639',
    textColor: '#84cc16',
    bgColor: 'rgba(164, 198, 57, 0.12)',
    borderColor: 'rgba(164, 198, 57, 0.3)',
    badgeLabel: 'Falabella',
    iconName: 'ShoppingBag',
  },
  {
    id: 'apple',
    name: 'Apple Store',
    domains: ['apple.com'],
    paramName: 'at',
    envVarKey: 'NEXT_PUBLIC_APPLE_AFFILIATE_TAG',
    color: '#A2AAAD',
    textColor: '#d1d5db',
    bgColor: 'rgba(162, 170, 173, 0.12)',
    borderColor: 'rgba(162, 170, 173, 0.3)',
    badgeLabel: 'Apple Store',
    iconName: 'Laptop',
  },
]

/**
 * Normaliza y añade el protocolo https si no lo tiene
 */
export function ensureUrlProtocol(rawUrl: string): string {
  const trimmed = rawUrl.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed}`
}

/**
 * Extrae el dominio legible de una URL (ej: amazon.com.mx, mercadolibre.com)
 */
export function extractCleanDomain(rawUrl: string): string {
  try {
    const urlObj = new URL(ensureUrlProtocol(rawUrl))
    return urlObj.hostname.replace(/^www\./i, '')
  } catch {
    return rawUrl
  }
}

/**
 * Transforma una URL. Si hay un tag de afiliado configurado lo inyecta, si no, deja el enlace original intacto.
 */
export function transformAffiliateUrl(rawUrl: string): AffiliateStoreInfo {
  const formattedUrl = ensureUrlProtocol(rawUrl)
  
  try {
    const urlObj = new URL(formattedUrl)
    const hostname = urlObj.hostname.toLowerCase()

    // Buscar si pertenece a alguna plataforma conocida
    const platform = PLATFORMS.find((p) =>
      p.domains.some((domain) => hostname.includes(domain))
    )

    if (platform) {
      // Verificar si hay un tag explícito configurado en variables de entorno
      const envTag = platform.envVarKey ? process.env[platform.envVarKey] : undefined
      const isAffiliated = Boolean(envTag && envTag.trim().length > 0)

      if (isAffiliated && platform.paramName && envTag) {
        urlObj.searchParams.set(platform.paramName, envTag)
      }

      return {
        platformId: platform.id,
        name: platform.name,
        domain: urlObj.hostname.replace(/^www\./i, ''),
        color: platform.color,
        textColor: platform.textColor,
        bgColor: platform.bgColor,
        borderColor: platform.borderColor,
        badgeLabel: platform.badgeLabel,
        iconName: platform.iconName,
        isAffiliated,
        affiliatedUrl: isAffiliated ? urlObj.toString() : formattedUrl,
        originalUrl: formattedUrl,
        affiliateTag: envTag,
      }
    }

    // Tienda o Enlace Genérico
    return {
      platformId: 'generic',
      name: extractCleanDomain(formattedUrl),
      domain: extractCleanDomain(formattedUrl),
      color: '#818cf8',
      textColor: '#818cf8',
      bgColor: 'rgba(129, 140, 248, 0.12)',
      borderColor: 'rgba(129, 140, 248, 0.3)',
      badgeLabel: 'Tienda Online',
      iconName: 'ExternalLink',
      isAffiliated: false,
      affiliatedUrl: formattedUrl,
      originalUrl: formattedUrl,
    }
  } catch {
    return {
      platformId: 'unknown',
      name: 'Enlace Web',
      domain: 'web',
      color: '#6b6b85',
      textColor: '#a0a0b8',
      bgColor: 'rgba(107, 107, 133, 0.12)',
      borderColor: 'rgba(107, 107, 133, 0.3)',
      badgeLabel: 'Web',
      iconName: 'ExternalLink',
      isAffiliated: false,
      affiliatedUrl: formattedUrl,
      originalUrl: formattedUrl,
    }
  }
}

/**
 * Procesa una lista de enlaces (array o texto multilinea)
 */
export function processReferenceLinks(links: unknown): AffiliateStoreInfo[] {
  if (!links) return []

  let rawList: string[] = []
  if (Array.isArray(links)) {
    rawList = links.filter((l): l is string => typeof l === 'string' && l.trim().length > 0)
  } else if (typeof links === 'string') {
    rawList = links.split('\n').filter((l) => l.trim().length > 0)
  }

  return rawList.map((l) => transformAffiliateUrl(l))
}
