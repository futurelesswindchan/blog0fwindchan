/**
 * 插画/作品接口（对应后端 Artwork.to_dict）。
 */
export interface Artwork {
  id: string
  title: string | null
  thumbnail: string | null
  fullsize: string | null
  description: string | null
  date: string | null
}
