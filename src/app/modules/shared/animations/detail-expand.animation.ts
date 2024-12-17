import { trigger, state, style, transition, animate } from "@angular/animations"

export const expandToFixedHeight = trigger("expandToFixedHeight", [
  state("false", style({ height: "0px" })),
  state("true", style({ height: "{{finalHeight}}px" }), {
    params: {
      finalHeight: 0,
    },
  }),
  transition("true <=> false", animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")),
])

export const expandVertically = trigger("expandVertically", [
  state(
    "false",
    style({ transformOrigin: "top center", transform: "scaleY(0)" })
  ),
  state(
    "true",
    style({ transformOrigin: "top center", transform: "scaleY(1)" }),
    {
      params: {
        finalHeight: 0,
      },
    }
  ),
  transition("true <=> false", animate("100ms cubic-bezier(0.4, 0.0, 0.2, 1)")),
])
