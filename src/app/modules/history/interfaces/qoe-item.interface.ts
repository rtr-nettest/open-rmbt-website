import { EQoeCategory } from "../constants/qoe-category.enum"

export interface IQoeItem {
  category: EQoeCategory
  classification: number
  quality: number
}
