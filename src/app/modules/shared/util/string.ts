export function truncate(text: string, max: number) {
  if (text.length <= max) {
    return text
  }
  let retVal = text.slice(0, max)
  const lastSpace = retVal.lastIndexOf(" ")
  if (lastSpace > -1) {
    retVal = retVal.slice(0, lastSpace)
  }
  return retVal + "&hellip;"
}
