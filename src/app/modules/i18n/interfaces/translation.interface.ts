export interface ITranslation {
  id: number
  key: string
  value: string
  locale: string
  parent?: ITranslation
  children: ITranslation[]
  source: string
  createdAt: string
  updatedAt: string
}
