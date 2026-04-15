export interface IEnvironment {
  baseUrl: string
  deployedUrl: string
  api: {
    baseUrl: string
  }
  loopModeDefaults: {
    default_delay: number
    default_tests: number
    max_delay: number
    max_tests: number
    min_delay: number
    min_tests: number
    exclude_from_result: string[]
  }
  certifiedDefaults: {
    default_delay: number
    default_tests: number
    max_speed_firefox_mbps: number
    exclude_from_result: string[]
    disable_graphics: boolean
  }
  features: {
    ip_check_interval_ms?: number
    show_failed_in_history: boolean
    show_fences_in_details?: boolean
    show_fences_in_history?: boolean
    show_fences_tile?: boolean
    show_server_selection: boolean
  }
  matomo?: {
    trackerUrl: string
    siteId: string
    [key: string]: any
  }
}
