export interface IpResponse {
  v: string
  ip: string
  nat_type?: string
  // When true, the client reaches us through a proxy; the proxy_* fields
  // describe where the proxy is located (they may be empty strings).
  is_proxy?: boolean
  proxy_country?: string
  proxy_region?: string
  proxy_city?: string
}
