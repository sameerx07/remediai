import client from './client'
import type { IncidentDetail, IncidentListItem, PaginatedResponse } from '../types/incident'

export interface ListIncidentsParams {
  page?: number
  page_size?: number
  status?: string
  priority?: string
  date_from?: string
  date_to?: string
}

export async function listIncidents(
  params: ListIncidentsParams = {},
): Promise<PaginatedResponse<IncidentListItem>> {
  const { data } = await client.get<PaginatedResponse<IncidentListItem>>('/incidents', { params })
  return data
}

export async function getIncident(id: string): Promise<IncidentDetail> {
  const { data } = await client.get<IncidentDetail>(`/incidents/${id}`)
  return data
}
