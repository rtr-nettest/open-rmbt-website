export enum EMNT {
  T_UNKNOWN = "Mobile",
  T_2G = "2G",
  T_3G = "3G",
  T_4G = "4G",
  T_5G_SA = "5G (SA)",
  T_5G_NSA = "5G (NSA)",
}

export const MobileNetworkTechnologyMap: Map<number, EMNT> = new Map([
  [0, EMNT.T_UNKNOWN],
  [1, EMNT.T_2G], // GPRS
  [2, EMNT.T_2G], // EDGE
  [3, EMNT.T_3G], // UMTS
  [4, EMNT.T_2G], // CDMA
  [5, EMNT.T_3G], // EVDO_0
  [6, EMNT.T_3G], // EVDO_A
  [7, EMNT.T_2G], // 1xRTT
  [8, EMNT.T_3G], // HSDPA
  [9, EMNT.T_3G], // HSUPA
  [10, EMNT.T_3G], // HSPA
  [11, EMNT.T_2G], // IDEN
  [12, EMNT.T_3G], // EVDO_B
  [13, EMNT.T_4G], // LTE
  [14, EMNT.T_3G], // EHRPD
  [15, EMNT.T_3G], // HSPAP
  [16, EMNT.T_2G], // GSM
  [17, EMNT.T_3G], // TD_SCDMA
  [18, EMNT.T_4G], // IWLAN
  [19, EMNT.T_4G], // LTE_CA
  [20, EMNT.T_5G_SA], // NR_SA
  [21, EMNT.T_5G_NSA], // NR_NSA
  [22, EMNT.T_5G_NSA], // NR_AVAILABLE
  [40, EMNT.T_4G], // LTE_NR
  [41, EMNT.T_5G_NSA], // NR_NSA
])

export const MobileNetworkColorMap: Map<number, string> = new Map([
  [0, "#d9d9d9"],
  [1, "#fca636"], // GPRS
  [2, "#fca636"], // EDGE
  [3, "#e16462"], // UMTS
  [4, "#fca636"], // CDMA
  [5, "#e16462"], // EVDO_0
  [6, "#e16462"], // EVDO_A
  [7, "#fca636"], // 1xRTT
  [8, "#e16462"], // HSDPA
  [9, "#e16462"], // HSUPA
  [10, "#e16462"], // HSPA
  [11, "#fca636"], // IDEN
  [12, "#e16462"], // EVDO_B
  [13, "#b12a90"], // LTE
  [14, "#e16462"], // EHRPD
  [15, "#e16462"], // HSPAP
  [16, "#fca636"], // GSM
  [17, "#e16462"], // TD_SCDMA
  [18, "#b12a90"], // IWLAN
  [19, "#b12a90"], // LTE_CA
  [20, "#6a1b9a"], // NR_SA
  [21, "#8e24aa"], // NR_NSA
  [22, "#8e24aa"], // NR_AVAILABLE
  [40, "#b12a90"], // LTE_NR
  [41, "#8e24aa"], // NR_NSA
])

export function getMobileNetworkTechnology(technologyId: number = 0): string {
  return MobileNetworkTechnologyMap.get(technologyId) || EMNT.T_UNKNOWN
}

export function getMobileNetworkColor(technologyId: number = 0): string {
  return MobileNetworkColorMap.get(technologyId) || "#d9d9d9"
}
