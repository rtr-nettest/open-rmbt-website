export const UNKNOWN = "UNKNOWN"
export const THIS_INTERRUPTS_ACTION = "The current action will be interrupted"
// Generic fallback for any error that is not mapped 1:1 below.
export const ERROR_OCCURED = "An error occurred. Please try again later."
export const ERROR_OCCURED_DURING_LOOP = "An error occurred during test"
// One webpage message per rmbtws `RMBTError` value. The measurement flow delivers
// the raw `RMBTError` string on `error$`; `RMBT_STATUS_MESSAGES` maps it to a
// user-facing message. Transient failures invite a retry; `NOT_SUPPORTED` is a
// permanent (browser capability) error, so it deliberately omits "try again".
export const ERROR_OCCURED_SENDING_RESULTS = "The results could not be stored."
export const ERROR_SERVER =
  "The measurement server responded with an error. Please retry later."
export const ERROR_CONNECT_FAILED =
  "The connection to the measurement server failed. Please try again later."
export const ERROR_SOCKET_INIT_FAILED =
  "The initialization of Websockets failed. Please try again later."
export const ERROR_REGISTRATION_FAILED =
  "The registration of the measurement failed."
export const ERROR_NOT_SUPPORTED = "Websockets are not supported."
// Keys are the exact `RMBTError` values emitted by rmbtws
// (see rmbtws/src/WebsockettestDatastructures.js). Unlisted values → ERROR_OCCURED.
export const RMBT_STATUS_MESSAGES: Record<string, string> = {
  "The measurement server responded with ERR": ERROR_SERVER,
  "connection to test server failed": ERROR_CONNECT_FAILED,
  "WebSocket initialization failed": ERROR_SOCKET_INIT_FAILED,
  "Error during test registration": ERROR_REGISTRATION_FAILED,
  "Error during submission of test results": ERROR_OCCURED_SENDING_RESULTS,
  "WebSockets are not supported": ERROR_NOT_SUPPORTED,
}
export const TERMS_AND_CONDITIONS = "Terms and conditions text"
export const UUID = "RMBTuuid"
export const RMBTTermsV6 = "RMBTTermsV6"
export const TERMS_VERSION = "RMBTTermsVersion"
export const RESULT_DATE_FORMAT = "YYYY-MM-DD HH:mm:ss"
export const TEST_FINISHED_ANNOUNCEMENT =
  "The test has finished. Showing the results page."
export const LOCATION_PERMISSION_DENIED =
  "RTR_NETZTEST_LOCATION_PERMISSION_DENIED"
