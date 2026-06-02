import { parseIsoDuration } from '~/lib/video-utils'
import type { TablesInsert } from '~/lib/database.types'

interface YouTubeVideoResponse {
  items?: Array<{
    id: string
    snippet?: {
      title?: string
      description?: string
      channelTitle?: string
      publishedAt?: string
      thumbnails?: {
        maxres?: { url: string }
        high?: { url: string }
        medium?: { url: string }
        default?: { url: string }
      }
    }
    contentDetails?: {
      duration?: string
    }
    statistics?: {
      viewCount?: string
      likeCount?: string
      commentCount?: string
    }
  }>
}

function toNullableNumber(value: string | undefined): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export async function fetchYouTubeMetadata(videoId: string): Promise<Partial<TablesInsert<'videos'>>> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return {}

  const url = new URL('https://www.googleapis.com/youtube/v3/videos')
  url.searchParams.set('id', videoId)
  url.searchParams.set('part', 'snippet,contentDetails,statistics')
  url.searchParams.set('key', apiKey)

  const response = await fetch(url)
  if (!response.ok) {
    console.warn('YouTube metadata lookup failed:', response.status, await response.text())
    return {}
  }

  const payload = (await response.json()) as YouTubeVideoResponse
  const item = payload.items?.[0]
  if (!item) return {}

  return {
    external_id: item.id,
    creator: item.snippet?.channelTitle ?? null,
    thumbnail_url:
      item.snippet?.thumbnails?.maxres?.url ??
      item.snippet?.thumbnails?.high?.url ??
      item.snippet?.thumbnails?.medium?.url ??
      item.snippet?.thumbnails?.default?.url ??
      null,
    title: item.snippet?.title ?? null,
    caption: item.snippet?.description ?? null,
    published_at: item.snippet?.publishedAt ?? null,
    duration_seconds: parseIsoDuration(item.contentDetails?.duration),
    view_count: toNullableNumber(item.statistics?.viewCount),
    like_count: toNullableNumber(item.statistics?.likeCount),
    comment_count: toNullableNumber(item.statistics?.commentCount),
  }
}
