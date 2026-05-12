import type { UserBrief } from "./auth"

export interface Message {
  id: string
  contract_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  sender?: UserBrief
}

export interface SendMessageRequest {
  content: string
}
