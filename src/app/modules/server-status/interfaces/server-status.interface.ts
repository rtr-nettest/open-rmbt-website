export interface IServerStatus {
  server_uuid: string
  name: string
  server_type: string
  protocol: number
  reachable: boolean
  latency_ms: number
  max_latency_ms: number
  min_latency_ms: number
  reachability_pct: number
}
