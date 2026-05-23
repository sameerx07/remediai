import client from './client'
import type { MetricsResponse } from '../types/metrics'

export async function getMetrics(): Promise<MetricsResponse> {
  const { data } = await client.get<MetricsResponse>('/metrics')
  return data
}
