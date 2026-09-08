export enum EMNTechReal {
  UNKNOWN = 0,
  GPRS = 1,
  EDGE = 2,
  UMTS = 3,
  CDMA = 4,
  EVDO_0 = 5,
  EVDO_A = 6,
  _1xRTT = 7,
  HSDPA = 8,
  HSUPA = 9,
  HSPA = 10,
  IDEN = 11,
  EVDO_B = 12,
  LTE = 13,
  EHRPD = 14,
  HSPAP = 15,
  GSM = 16,
  TD_SCDMA = 17,
  IWLAN = 18,
  LTE_CA = 19,
  NR_SA = 20,
  NR_NSA = 21,
  NR_AVAILABLE = 22,
  LTE_NR = 40,
  NR_NSA_41 = 41,
  OFFLINE = 1000,
}

export enum EMNTech {
  T_UNKNOWN = "Unknown",
  T_2G = "2G",
  T_3G = "3G",
  T_4G = "4G",
  T_5G_SA = "5G (SA)",
  T_5G_NSA = "5G (NSA)",
  T_OFFLINE = "Offline",
}

export enum EMNTechColor {
  T_2G = "#FFDE00",
  T_3G = "#EFFF00",
  T_4G = "#00BFFF",
  T_5G_NSA = "#0091FF",
  T_5G_SA = "#5E00FF",
  T_OFFLINE = "#A0A0A0",
}

export const MobileNetworkTechnologyMap: Map<number, EMNTech> = new Map([
  [EMNTechReal.UNKNOWN, EMNTech.T_UNKNOWN],
  [EMNTechReal.GPRS, EMNTech.T_2G],
  [EMNTechReal.EDGE, EMNTech.T_2G],
  [EMNTechReal.UMTS, EMNTech.T_3G],
  [EMNTechReal.CDMA, EMNTech.T_2G],
  [EMNTechReal.EVDO_0, EMNTech.T_3G],
  [EMNTechReal.EVDO_A, EMNTech.T_3G],
  [EMNTechReal._1xRTT, EMNTech.T_2G],
  [EMNTechReal.HSDPA, EMNTech.T_3G],
  [EMNTechReal.HSUPA, EMNTech.T_3G],
  [EMNTechReal.HSPA, EMNTech.T_3G],
  [EMNTechReal.IDEN, EMNTech.T_2G],
  [EMNTechReal.EVDO_B, EMNTech.T_3G],
  [EMNTechReal.LTE, EMNTech.T_4G],
  [EMNTechReal.EHRPD, EMNTech.T_3G],
  [EMNTechReal.HSPAP, EMNTech.T_3G],
  [EMNTechReal.GSM, EMNTech.T_2G],
  [EMNTechReal.TD_SCDMA, EMNTech.T_3G],
  [EMNTechReal.IWLAN, EMNTech.T_4G],
  [EMNTechReal.LTE_CA, EMNTech.T_4G],
  [EMNTechReal.NR_SA, EMNTech.T_5G_SA],
  [EMNTechReal.NR_NSA, EMNTech.T_5G_NSA],
  [EMNTechReal.NR_AVAILABLE, EMNTech.T_5G_NSA],
  [EMNTechReal.LTE_NR, EMNTech.T_4G],
  [EMNTechReal.NR_NSA_41, EMNTech.T_5G_NSA],
  [EMNTechReal.OFFLINE, EMNTech.T_OFFLINE],
])

export const MobileNetworkColorMap: Map<number, string> = new Map([
  [EMNTechReal.UNKNOWN, EMNTechColor.T_OFFLINE],
  [EMNTechReal.GPRS, EMNTechColor.T_2G],
  [EMNTechReal.EDGE, EMNTechColor.T_2G],
  [EMNTechReal.UMTS, EMNTechColor.T_3G],
  [EMNTechReal.CDMA, EMNTechColor.T_2G],
  [EMNTechReal.EVDO_0, EMNTechColor.T_3G],
  [EMNTechReal.EVDO_A, EMNTechColor.T_3G],
  [EMNTechReal._1xRTT, EMNTechColor.T_2G],
  [EMNTechReal.HSDPA, EMNTechColor.T_3G],
  [EMNTechReal.HSUPA, EMNTechColor.T_3G],
  [EMNTechReal.HSPA, EMNTechColor.T_3G],
  [EMNTechReal.IDEN, EMNTechColor.T_2G],
  [EMNTechReal.EVDO_B, EMNTechColor.T_3G],
  [EMNTechReal.LTE, EMNTechColor.T_4G],
  [EMNTechReal.EHRPD, EMNTechColor.T_3G],
  [EMNTechReal.HSPAP, EMNTechColor.T_3G],
  [EMNTechReal.GSM, EMNTechColor.T_2G],
  [EMNTechReal.TD_SCDMA, EMNTechColor.T_3G],
  [EMNTechReal.IWLAN, EMNTechColor.T_4G],
  [EMNTechReal.LTE_CA, EMNTechColor.T_4G],
  [EMNTechReal.NR_SA, EMNTechColor.T_5G_SA],
  [EMNTechReal.NR_NSA, EMNTechColor.T_5G_NSA],
  [EMNTechReal.NR_AVAILABLE, EMNTechColor.T_5G_NSA],
  [EMNTechReal.LTE_NR, EMNTechColor.T_4G],
  [EMNTechReal.NR_NSA_41, EMNTechColor.T_5G_NSA],
  [EMNTechReal.OFFLINE, EMNTechColor.T_OFFLINE],
])

export function getMobileNetworkTechnology(technologyId: number = 0): string {
  return MobileNetworkTechnologyMap.get(technologyId) || EMNTech.T_UNKNOWN
}

export function getMobileNetworkColor(technologyId: number = 0): string {
  return MobileNetworkColorMap.get(technologyId) || EMNTechColor.T_OFFLINE
}
