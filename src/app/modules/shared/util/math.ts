export function roundMs(value: number) {
  const resultNum = Math.round(value)
  let rounder = 1
  if (resultNum < 10) {
    rounder = 100
  } else if (resultNum < 100) {
    rounder = 10
  }
  return Math.round(value * rounder) / rounder
}

export function roundToSignificantDigits(number: number) {
  let rounder = 1
  if (number < 0.1) {
    rounder = 1000
  } else if (number < 1) {
    rounder = 100
  } else if (number < 10) {
    rounder = 10
  }
  return Math.round(number * rounder) / rounder
}

export function speedLog(speedMbps?: number) {
  if (!speedMbps) {
    return -1
  }
  let yPercent = (1 + Math.log10(speedMbps)) / 5
  yPercent = Math.max(yPercent, 0)
  yPercent = Math.min(1, yPercent)
  return yPercent
}
