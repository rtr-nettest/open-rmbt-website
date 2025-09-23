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
    show_server_selection: boolean
  }
  matomo?: {
    trackerUrl: string
    siteId: string
    [key: string]: any
  }
}
