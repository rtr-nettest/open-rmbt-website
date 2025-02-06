import { ILink } from "./link.interface"

export interface IMainMenuItem extends ILink {
  action?: (e: MouseEvent) => any
  children?: IMainMenuItem[]
  className?: string
  content?: string
  createdAt?: string
  description?: string
  hidden?: boolean
  icon?: string
  id?: string
  menu_order?: number
  parent?: string
}
