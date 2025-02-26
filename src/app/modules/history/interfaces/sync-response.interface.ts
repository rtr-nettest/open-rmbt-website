export interface ISyncResponse {
  error: string[]
  sync: [
    {
      sync_code: string
      msg_title: string
      msg_text: string
      success: boolean
    }
  ]
}
