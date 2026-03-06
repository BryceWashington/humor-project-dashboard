export interface Profile {
  id: string
  created_datetime_utc: string
  modified_datetime_utc?: string
  first_name?: string
  last_name?: string
  email?: string
  is_superadmin: boolean
}

export interface Image {
  id: string
  created_datetime_utc: string
  modified_datetime_utc?: string
  url?: string
  profile_id?: string
  image_description?: string
  is_public: boolean
  profiles?: Profile
}

export interface Caption {
  id: string
  created_datetime_utc: string
  content?: string
  is_public: boolean
  profile_id: string
  image_id: string
  like_count: number
  is_featured: boolean
  profiles?: Profile
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_datetime_utc'>
        Update: Partial<Omit<Profile, 'id' | 'created_datetime_utc'>>
      }
      images: {
        Row: Image
        Insert: Omit<Image, 'id' | 'created_datetime_utc'>
        Update: Partial<Omit<Image, 'id' | 'created_datetime_utc'>>
      }
      captions: {
        Row: Caption
        Insert: Omit<Caption, 'id' | 'created_datetime_utc'>
        Update: Partial<Omit<Caption, 'id' | 'created_datetime_utc'>>
      }
    }
  }
}
