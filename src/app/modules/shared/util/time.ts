import dayjs from "dayjs"

export const adjustTimePeriod = (
  period: [number, string],
  endDate: dayjs.Dayjs
) => {
  const val = period[0]
  const spans = [
    {
      count: 30,
      unit: "months" as const,
    },
    {
      count: 365,
      unit: "years" as const,
    },
  ]
  for (let i = 0; i < spans.length; i++) {
    const timespan = spans[i]
    if (val > 7 && val % timespan.count <= 6) {
      var units = Math.round(val / timespan.count)
      var then = dayjs(endDate).subtract(units, timespan.unit)

      //if the end of a month is selected - then should also be the end of a month!
      if (
        timespan.unit === "months" &&
        dayjs(endDate).format("YYYY-MM-DD") ===
          dayjs(endDate).endOf("month").format("YYYY-MM-DD")
      ) {
        then = then.endOf("month").startOf("day")
      }

      period[0] = dayjs(endDate).diff(then, "days")
    }
  }
}
