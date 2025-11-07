export function truncate(text: string, max: number) {
  if (text.length <= max) {
    return text
  }
  let retVal = text.slice(0, max)
  const lastSpace = retVal.lastIndexOf(" ")
  if (lastSpace > -1) {
    retVal = retVal.slice(0, lastSpace)
  }
  return retVal + "…"
}

export function pad(number: number, length: number) {
  let str = "" + number
  while (str.length < length) {
    str = "0" + str
  }

  return str
}

export function deHtmlize(text: string) {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, "text/html")
    const textContent = doc.body.textContent || ""
    return textContent.trim()
  } catch (_) {
    return text
  }
}

export function capitalize(text: string) {
  if (!text) {
    return text
  }
  return text.charAt(0).toUpperCase() + text.slice(1)
}
