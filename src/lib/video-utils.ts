import type { VideoPlatform } from '~/schema'

export interface ParsedVideoUrl {
  platform: VideoPlatform
  externalId: string | null
}

export function parseVideoUrl(url: string): ParsedVideoUrl {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      return { platform: 'youtube', externalId: parsed.pathname.split('/').filter(Boolean)[0] ?? null }
    }

    if (host.endsWith('youtube.com')) {
      const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/?]+)/)
      const embedMatch = parsed.pathname.match(/^\/embed\/([^/?]+)/)
      return {
        platform: 'youtube',
        externalId: parsed.searchParams.get('v') ?? shortsMatch?.[1] ?? embedMatch?.[1] ?? null,
      }
    }

    if (host.endsWith('tiktok.com')) {
      return { platform: 'tiktok', externalId: parsed.pathname.match(/\/video\/(\d+)/)?.[1] ?? null }
    }

    if (host.endsWith('instagram.com')) {
      const match = parsed.pathname.match(/^\/(reel|p)\/([^/?]+)/)
      return { platform: 'instagram', externalId: match?.[2] ?? null }
    }
  } catch {
    return { platform: 'other', externalId: null }
  }

  return { platform: 'other', externalId: null }
}

export function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export function formatDuration(totalSeconds: number | null): string {
  if (!totalSeconds) return 'Unknown'
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function parseIsoDuration(duration: string | undefined): number | null {
  if (!duration) return null
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!match) return null
  const [, hours = '0', minutes = '0', seconds = '0'] = match
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)
}
