/// <reference lib="webworker" />

let worker: TestTimerWorker | undefined

addEventListener("message", ({ data }) => {
  switch (data.type) {
    case "startTimer":
      worker = new TestTimerWorker(data.interval)
      worker.startTimer()
      break
    case "pauseTimer":
      worker?.pauseTimer()
      break
    case "resumeTimer":
      worker?.resumeTimer()
      break
  }
})

class TestTimerWorker {
  secondsPassed = 0
  intervalId?: NodeJS.Timeout

  constructor(private intervalSeconds: number) {}

  startTimer() {
    this.secondsPassed = 0
    this.resumeTimer()
  }

  pauseTimer() {
    clearInterval(this.intervalId)
    this.intervalId = undefined
  }

  resumeTimer() {
    this.intervalId = undefined
    this.intervalId = setInterval(() => {
      this.secondsPassed += 1
      if (this.secondsPassed >= this.intervalSeconds) {
        this.secondsPassed = 0
        postMessage({ type: "timer", secondsPassed: this.secondsPassed })
      }
    }, 1000)
  }
}
