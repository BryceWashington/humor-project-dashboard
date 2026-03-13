export interface Profile {
  id: string
  created_datetime_utc: string
  modified_datetime_utc?: string
  first_name?: string
  last_name?: string
  email?: string
  is_superadmin: boolean
  is_in_study: boolean
  is_matrix_admin: boolean
}

export interface Image {
  id: string
  created_datetime_utc: string
  modified_datetime_utc?: string
  url?: string
  profile_id?: string
  image_description?: string
  is_public: boolean
  is_common_use: boolean
}

export interface Caption {
  id: string
  created_datetime_utc: string
  modified_datetime_utc?: string
  content?: string
  is_public: boolean
  profile_id: string
  image_id: string
  humor_flavor_id?: number
  is_featured: boolean
  caption_request_id?: number
  like_count: number
  llm_prompt_chain_id?: number
}

export interface HumorFlavor {
  id: number
  created_datetime_utc: string
  description?: string
  slug: string
}

export interface HumorFlavorStep {
  id: number
  created_datetime_utc: string
  humor_flavor_id: number
  llm_temperature?: number
  order_by: number
  llm_input_type_id: number
  llm_output_type_id: number
  llm_model_id: number
  humor_flavor_step_type_id: number
  llm_system_prompt?: string
  llm_user_prompt?: string
  description?: string
}

export interface HumorFlavorMix {
  id: number
  created_datetime_utc: string
  humor_flavor_id: number
  caption_count: number
}

export interface Term {
  id: number
  created_datetime_utc: string
  modified_datetime_utc?: string
  term: string
  definition: string
  example: string
  priority: number
  term_type_id?: number
}

export interface CaptionRequest {
  id: number
  created_datetime_utc: string
  profile_id: string
  image_id: string
}

export interface CaptionExample {
  id: number
  created_datetime_utc: string
  modified_datetime_utc?: string
  image_description: string
  caption: string
  explanation: string
  priority: number
  image_id: string | null
}

export interface LLMModel {
  id: number
  created_datetime_utc: string
  name: string
  llm_provider_id: number
  provider_model_id: string
  is_temperature_supported: boolean
}

export interface LLMProvider {
  id: number
  created_datetime_utc: string
  name: string
}

export interface LLMPromptChain {
  id: number
  created_datetime_utc: string
  caption_request_id: number
}

export interface LLMModelResponse {
  id: string
  created_datetime_utc: string
  llm_model_response?: string
  processing_time_seconds: number
  llm_model_id: number
  profile_id: string
  caption_request_id: number
  llm_system_prompt: string
  llm_user_prompt: string
  llm_temperature?: number
  humor_flavor_id: number
  llm_prompt_chain_id?: number
  humor_flavor_step_id?: number
}

export interface AllowedSignupDomain {
  id: number
  created_datetime_utc: string
  apex_domain: string
}

export interface WhitelistEmailAddress {
  id: number
  created_datetime_utc: string
  modified_datetime_utc?: string
  email_address: string
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
      humor_flavors: {
        Row: HumorFlavor
        Insert: Omit<HumorFlavor, 'id' | 'created_datetime_utc'>
        Update: Partial<Omit<HumorFlavor, 'id' | 'created_datetime_utc'>>
      }
      humor_flavor_steps: {
        Row: HumorFlavorStep
        Insert: Omit<HumorFlavorStep, 'id' | 'created_datetime_utc'>
        Update: Partial<Omit<HumorFlavorStep, 'id' | 'created_datetime_utc'>>
      }
      humor_flavor_mix: {
        Row: HumorFlavorMix
        Insert: Omit<HumorFlavorMix, 'id' | 'created_datetime_utc'>
        Update: Partial<Omit<HumorFlavorMix, 'id' | 'created_datetime_utc'>>
      }
      terms: {
        Row: Term
        Insert: Omit<Term, 'id' | 'created_datetime_utc'>
        Update: Partial<Omit<Term, 'id' | 'created_datetime_utc'>>
      }
      caption_requests: {
        Row: CaptionRequest
        Insert: Omit<CaptionRequest, 'id' | 'created_datetime_utc'>
        Update: Partial<Omit<CaptionRequest, 'id' | 'created_datetime_utc'>>
      }
      caption_examples: {
        Row: CaptionExample
        Insert: Omit<CaptionExample, 'id' | 'created_datetime_utc'>
        Update: Partial<Omit<CaptionExample, 'id' | 'created_datetime_utc'>>
      }
      llm_models: {
        Row: LLMModel
        Insert: Omit<LLMModel, 'id' | 'created_datetime_utc'>
        Update: Partial<Omit<LLMModel, 'id' | 'created_datetime_utc'>>
      }
      llm_providers: {
        Row: LLMProvider
        Insert: Omit<LLMProvider, 'id' | 'created_datetime_utc'>
        Update: Partial<Omit<LLMProvider, 'id' | 'created_datetime_utc'>>
      }
      llm_prompt_chains: {
        Row: LLMPromptChain
        Insert: Omit<LLMPromptChain, 'id' | 'created_datetime_utc'>
        Update: Partial<Omit<LLMPromptChain, 'id' | 'created_datetime_utc'>>
      }
      llm_model_responses: {
        Row: LLMModelResponse
        Insert: Omit<LLMModelResponse, 'id' | 'created_datetime_utc'>
        Update: Partial<Omit<LLMModelResponse, 'id' | 'created_datetime_utc'>>
      }
      allowed_signup_domains: {
        Row: AllowedSignupDomain
        Insert: Omit<AllowedSignupDomain, 'id' | 'created_datetime_utc'>
        Update: Partial<Omit<AllowedSignupDomain, 'id' | 'created_datetime_utc'>>
      }
      whitelist_email_addresses: {
        Row: WhitelistEmailAddress
        Insert: Omit<WhitelistEmailAddress, 'id' | 'created_datetime_utc'>
        Update: Partial<Omit<WhitelistEmailAddress, 'id' | 'created_datetime_utc'>>
      }
    }
  }
}
