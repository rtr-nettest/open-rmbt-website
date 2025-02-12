export const searchFromFilters = (filters: Record<string, any>) => {
  return Object.keys(filters)
    .map((key) => {
      const value = (filters as any)[key]
      if (Array.isArray(value)) {
        const params = value.map((v) => `${key}[]=${v}`)
        if (params.length > 1) return params.join("&")
        return params[0]
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
        filters[key] = []
      }
      filters[key].push(value)
    } else {
      filters[key] = value
    }
  }
  return filters
}
