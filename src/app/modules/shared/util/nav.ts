export const setGoBackLocation = (url: string) => {
  if (globalThis.location) {
    globalThis.history.replaceState(null, "", url)
  }
}
