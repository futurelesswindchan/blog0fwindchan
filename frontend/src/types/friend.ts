/**
 * 友链数据接口（对应后端 Friend.to_dict）。
 */
export interface Friend {
  id: string
  name: string
  desc: string | null
  url: string | null
  avatar: string | null
  tags: string[] | null
}
