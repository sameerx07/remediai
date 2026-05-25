export interface LogLine {
  ts: string
  container: string
  line: string
  level: string
  is_exception: boolean
  incident_id: string | null
}
