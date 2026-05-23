export interface StatusCount {
  status: string
  count: number
}

export interface PriorityCount {
  priority: string
  count: number
}

export interface TopError {
  exception_type: string
  count: number
}

export interface MetricsResponse {
  total_incidents: number
  total_analyzed: number
  by_status: StatusCount[]
  by_priority: PriorityCount[]
  top_errors: TopError[]
}
