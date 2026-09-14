const express = require("express")
const { createProxyMiddleware } = require("http-proxy-middleware")

const host = process.env.PROXY_HOST || "dev2.netztest.at"
// Origin/Referer sent upstream. Defaults to the target host (works for dev2,
// which serves frontend + control server on the same host). Production splits
// them: the control server (c01) only allows the frontend origin (www), so set
// PROXY_ORIGIN=https://www.netztest.at when PROXY_HOST=c01.netztest.at.
const origin = process.env.PROXY_ORIGIN || `https://${host}`
const app = express()

app.use(
  "/",
  createProxyMiddleware({
    target: `https://${host}`,
    secure: false,
    logLevel: "debug",
    on: {
      proxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader("Host", host)
        proxyReq.setHeader("Origin", origin)
        proxyReq.setHeader("Referer", `${origin}/`)
      },
      error: (err, req, res) => {
        console.error("Proxy error:", err)
        res.status(500).send("Proxy error")
      },
      proxyRes: (proxyRes, req, res) => {
        proxyRes.headers["Access-Control-Allow-Origin"] = "*"
        proxyRes.headers["Access-Control-Allow-Methods"] =
          "GET,POST,PUT,DELETE,OPTIONS"
      },
    },
  })
)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`)
})
