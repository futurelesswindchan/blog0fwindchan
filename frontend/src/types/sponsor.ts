/**
 * 投喂感谢数据接口（对应后端 Sponsor.to_dict）。
 */
export interface Sponsor {
  id: number
  name: string
  avatar: string | null
  url: string | null
  message: string | null
  date: string | null
}
