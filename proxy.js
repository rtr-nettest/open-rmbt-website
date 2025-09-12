const express = require("express")
const { createProxyMiddleware } = require("http-proxy-middleware")

const host = "dev2.netztest.at"
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
        proxyReq.setHeader("Origin", `https://${host}`)
        proxyReq.setHeader("Referer", `https://${host}/`)
      },
      error: (err, req, res) => {
        console.error("Proxy error:", err)
        res.status(500).send("Proxy error")
      },
      proxyRes: (proxyRes, req, res) => {
        proxyRes.headers["Access-Control-Allow-Origin"] = "*"
        proxyRes.headers["Access-Control-Allow-Methods"] =
          "GET,POST,PUT,DELETE,OPTIONS"
        console.log("Proxying response:", proxyRes.headers)
      },
    },
  })
)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`)
})
