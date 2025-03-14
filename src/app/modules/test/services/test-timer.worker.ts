/// <reference lib="webworker" />

let timer: any | undefined

addEventListener("message", ({ data }) => {
  switch (data.type) {
    case "startTimer":
      timer = setInterval(() => {
        postMessage({ type: "timer", data: new Date().getTime() })
      }, data.payload)
      break
  }
})
