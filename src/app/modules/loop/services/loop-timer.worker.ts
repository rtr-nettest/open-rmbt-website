/// <reference lib="webworker" />

// Minimum gap between the END of one test and the START of the next, so tests
// never run back-to-back. A 0 interval means "just this break after each test".
const MIN_BREAK_MS = 5000

let worker: TestTimerWorker | undefined

addEventListener("message", ({ data }) => {
  switch (data.type) {
    case "startTimer":
      worker = new TestTimerWorker(data.interval)
      worker.startTimer()
      break
    case "testStarted":
      worker?.testStarted()
      break
    case "testFinished":
      worker?.testFinished()
      break
    case "pauseTimer":
      worker?.pauseTimer()
      break
    case "resumeTimer":
      worker?.resumeTimer()
      break
  }
})

// Schedules the NEXT test of a loop. The next test must start at the LATER of:
//   • `interval` after the current test STARTED  (fixed start-to-start cadence
//     when the interval exceeds the test duration), and
//   • MIN_BREAK after the current test FINISHED   (so there is always a 5s gap,
//     and a 0 interval means "MIN_BREAK after each test finishes").
//
// Anchoring to the actual finish is what prevents the pile-up: the main thread
// reports when each test starts/finishes, the "timer" message is emitted exactly
// once per completed test, and never while a test is still running — so a slow
// test just delays the next one instead of queuing up overlapping tests.
class TestTimerWorker {
  private intervalMs: number
  private intervalId?: ReturnType<typeof setInterval>
  private startMs = 0 // when the current test started
  private finishMs = 0 // when the current test finished (0 = still running)
  private running = false
  private pausedAt = 0

  constructor(intervalSeconds: number) {
    this.intervalMs = intervalSeconds * 1000
  }

  startTimer() {
    // The first test is started by the main thread; treat the loop as running
    // from now so the next test is scheduled relative to it.
    this.startMs = Date.now()
    this.finishMs = 0
    this.running = true
    this.pausedAt = 0
    this.resumeTimer()
  }

  testStarted() {
    this.startMs = Date.now()
    this.finishMs = 0
    this.running = true
  }

  testFinished() {
    this.finishMs = Date.now()
    this.running = false
  }

  pauseTimer() {
    clearInterval(this.intervalId)
    this.intervalId = undefined
    if (!this.pausedAt) {
      this.pausedAt = Date.now()
    }
  }

  resumeTimer() {
    // Shift the anchors forward by the paused duration so a pause freezes the
    // countdown instead of firing immediately on resume.
    if (this.pausedAt) {
      const pausedMs = Date.now() - this.pausedAt
      this.startMs += pausedMs
      if (this.finishMs) {
        this.finishMs += pausedMs
      }
      this.pausedAt = 0
    }
    clearInterval(this.intervalId)
    this.intervalId = setInterval(() => this.tick(), 1000)
  }

  private tick() {
    // Never schedule the next test while one is running, or before the first
    // test has finished.
    if (this.running || this.finishMs === 0) {
      return
    }
    const nextAt = Math.max(
      this.startMs + this.intervalMs,
      this.finishMs + MIN_BREAK_MS
    )
    if (Date.now() >= nextAt) {
      // Optimistically mark running (and anchor the next start to now) so a slow
      // main-thread start cannot make the next tick fire a second time.
      this.running = true
      this.startMs = Date.now()
      postMessage({ type: "timer" })
    }
  }
}
