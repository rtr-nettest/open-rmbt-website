export const round = (result: number) => {
  const resultNum = Math.round(result)
  let rounder = 1
  if (resultNum < 1) {
    rounder = 1000
  } else if (resultNum < 10) {
    rounder = 100
  } else if (resultNum < 100) {
    rounder = 10
  }
  return Math.round(result * rounder) / rounder
}
