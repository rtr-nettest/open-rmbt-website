// TODO: dates

export const queryParamsFromFilters = (
  filters: Record<string, any>,
  conversions?: {
    [key: string]: (value: any) => any
  }
) => {
  const params = [] as [string, string][]
  for (const [key, value] of Object.entries(filters)) {
    if (value === null || value === undefined || value === "") {
      continue
    }
    if (Array.isArray(value)) {
      for (const v of value) {
        params.push([`${key}[]`, conversions?.[key] ? conversions[key](v) : v])
      }
    } else {
      const v = conversions?.[key] ? conversions[key](value) : value
      if (key.endsWith("_from")) {
        params.push([key.replace("_from", "[]"), v])
      } else if (key.endsWith("_to")) {
        params.push([key.replace("_to", "[]"), v])
      } else {
        params.push([key, v])
      }
    }
  }
  return params
}

export const searchFromFilters = (
  filters: Record<string, any>,
  conversions?: {
    [key: string]: (value: any) => any
  }
) => {
  const params = queryParamsFromFilters(filters, conversions)
  return params
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&")
}

export const filtersFromSearch = (
  search: string,
  conversions?: {
    [key: string]: (value: any) => any
  }
) => {
  const params = search.split("&")
  const filters = {} as Record<string, any>
  for (const param of params) {
    const [key, value] = decodeURIComponent(param).split("=")
    if (key.endsWith("[]")) {
      if (value.startsWith("<")) {
        const newKey = `${key.replace("[]", "")}_to`
        filters[newKey] = conversions?.[newKey]
          ? conversions[newKey](value.slice(1))
          : value.slice(1)
      } else if (value.startsWith(">")) {
        const newKey = `${key.replace("[]", "")}_from`
        filters[newKey] = conversions?.[newKey]
          ? conversions[newKey](value.slice(1))
          : value.slice(1)
      } else {
        continue
      }
    } else {
      filters[key] = value
    }
  }
  return filters
}
