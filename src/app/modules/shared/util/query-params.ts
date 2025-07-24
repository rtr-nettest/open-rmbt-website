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
    const formatValue = (value: any, newKey?: string) => {
      const v = conversions?.[key] ? conversions[key](value) : value
      if (key.endsWith("_from")) {
        params.push([key.replace("_from", "[]"), `>${v}`])
      } else if (key.endsWith("_to")) {
        params.push([key.replace("_to", "[]"), `<${v}`])
      } else if (newKey) {
        params.push([newKey, v])
      } else {
        params.push([key, v])
      }
    }
    if (Array.isArray(value)) {
      for (const v of value) {
        formatValue(v, `${key}[]`)
      }
    } else {
      formatValue(value)
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
        filters[key] = conversions?.[key] ? conversions[key](value) : value
      }
    }
  }
  return filters
}
