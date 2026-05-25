import client from './client'
import type { LogLine } from '../types/localLogs'

export async function fetchLocalLogs(params?: {
  container?: string
  limit?: number
}): Promise<LogLine[]> {
  const { data } = await client.get<LogLine[]>('/local/logs', { params })
  return data
}
