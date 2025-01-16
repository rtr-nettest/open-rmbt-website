import { StyleSpecification } from "maplibre-gl"
import { EBasemapType } from "./basemap-type.enum"

export const BASE_SOURCE = {
  type: "raster" as const,
  tileSize: 256,
  attribution:
    "&copy; <a href='https://basemap.at' target='_blank'>basemap.at</a>",
  maxzoom: 19,
}

export const DEFAULT_STYLE: StyleSpecification = {
  version: 8 as const,
  sources: {
    [EBasemapType.OSM]: {
      ...BASE_SOURCE,
      tiles: ["https://cache.netztest.at/tile/osm/{z}/{x}/{y}.png"],
      attribution: "&copy; OpenStreetMap Contributors",
    },
    [EBasemapType.BMAPGRAU]: {
      ...BASE_SOURCE,
      tiles: [
        `http://mapsneu.wien.gv.at/basemap/${EBasemapType.BMAPGRAU}/normal/google3857/{z}/{y}/{x}.png`,
      ],
    },
  },
  layers: [
    {
      id: EBasemapType.OSM,
      type: "raster" as const,
      source: EBasemapType.OSM, // This must match the source key above
    },
    {
      id: EBasemapType.BMAPGRAU,
      type: "raster" as const,
      source: EBasemapType.BMAPGRAU,
    },
  ],
}

export const BASEMAP_STYLE: StyleSpecification = {
  version: 8 as const,
  sources: {
    [EBasemapType.BMAPOVERLAY]: {
      ...BASE_SOURCE,
      tiles: [
        `http://mapsneu.wien.gv.at/basemap/${EBasemapType.BMAPOVERLAY}/normal/google3857/{z}/{y}/{x}.png`,
      ],
    },
    [EBasemapType.BMAPORTHO]: {
      ...BASE_SOURCE,
      tiles: [
        // TODO: nothing loads from here
        `http://mapsneu.wien.gv.at/basemap/${EBasemapType.BMAPORTHO}/normal/google3857/{z}/{y}/{x}.png`,
      ],
    },
    [EBasemapType.BMAPHDPI]: {
      ...BASE_SOURCE,
      tiles: [
        // TODO: nothing loads from here
        `http://mapsneu.wien.gv.at/basemap/${EBasemapType.BMAPHDPI}/normal/google3857/{z}/{y}/{x}.png`,
      ],
    },
  },
  layers: [
    {
      id: EBasemapType.BMAPORTHO,
      type: "raster" as const,
      source: EBasemapType.BMAPORTHO,
    },
    {
      id: EBasemapType.BMAPOVERLAY,
      type: "raster" as const,
      source: EBasemapType.BMAPOVERLAY,
    },
    {
      id: EBasemapType.BMAPHDPI,
      type: "raster" as const,
      source: EBasemapType.BMAPHDPI,
    },
  ],
}

export const BASEMAP_AT_VECTOR_STYLE =
  "https://mapsneu.wien.gv.at/basemapvectorneu/root.json"
