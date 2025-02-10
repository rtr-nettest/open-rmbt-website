export const searchFromFilters = (filters: Record<string, any>) => {
  return Object.keys(filters)
    .map((key) => {
      const value = (filters as any)[key]
      if (Array.isArray(value)) {
        const param = []
        const [from, to] = value
        if (from) param.push(`${key}[]=>${from}`)
        if (to) param.push(`${key}[]=<${to}`)
        if (param.length === 2) return param.join("&")
        return param[0]
      }
      return `${key}=${value}`
    })
    .join("&")
}

export const filtersFromSearch = (search: string) => {
  const params = search.split("&")
  const filters = {} as Record<string, any>
  for (const param of params) {
    const [key, value] = param.split("=")
    if (key.endsWith("[]")) {
      if (!filters[key]) {
        filters[key] = [null, null]
      }
      if (value.startsWith(">")) {
        filters[key][0] = value.slice(2)
      } else if (value.startsWith("<")) {
        filters[key][1] = value.slice(2)
      }
    } else {
      filters[key] = value
    }
  }
  return filters
}
