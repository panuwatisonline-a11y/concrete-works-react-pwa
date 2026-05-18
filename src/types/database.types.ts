import type {
  CompressionMachineInsert,
  CompressionMachineRow,
  CompressionMachineUpdate,
  CstInsert,
  CstRow,
  CstUpdate,
  CstViewRow,
} from './database.cst.types'

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          employee_id: string | null
          fname: string | null
          lname: string | null
          phone: string | null
          role: 'admin' | 'manager' | 'user'
          client_id: number | null
          client_name: string | null
          job_id: number | null
          avatar_url: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          employee_id?: string | null
          fname?: string | null
          lname?: string | null
          phone?: string | null
          role?: 'admin' | 'manager' | 'user'
          client_id?: number | null
          client_name?: string | null
          job_id?: number | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          employee_id?: string | null
          fname?: string | null
          lname?: string | null
          phone?: string | null
          role?: 'admin' | 'manager' | 'user'
          client_id?: number | null
          client_name?: string | null
          job_id?: number | null
          avatar_url?: string | null
          updated_at?: string | null
        }
      }
      Status: {
        Row: {
          id: number
          status_name: string
          description: string | null
        }
        Insert: { id?: number; status_name: string; description?: string | null }
        Update: { id?: number; status_name?: string; description?: string | null }
      }
      Client: {
        Row: { id: number; client_name: string }
        Insert: { id?: number; client_name: string }
        Update: { id?: number; client_name?: string }
      }
      Jobs: {
        Row: { id: number; job_name: string }
        Insert: { id?: number; job_name: string }
        Update: { id?: number; job_name?: string }
      }
      Location: {
        Row: {
          id: number
          location1: string
          location2: string | null
          location3: string | null
          full_location: string | null
          description: string | null
        }
        Insert: {
          id?: number
          location1: string
          location2?: string | null
          location3?: string | null
          description?: string | null
        }
        Update: {
          id?: number
          location1?: string
          location2?: string | null
          location3?: string | null
          description?: string | null
        }
      }
      'Concrete Works': {
        Row: { id: number; concrete_work: string; structure_list: string | null }
        Insert: { id?: number; concrete_work: string; structure_list?: string | null }
        Update: { id?: number; concrete_work?: string; structure_list?: string | null }
      }
      Structure: {
        Row: { id: number; structure_name: string }
        Insert: { id?: number; structure_name: string }
        Update: { id?: number; structure_name?: string }
      }
      'Mixed Code': {
        Row: {
          id: number
          mixcode: string
          supplier: string | null
          strength: number | null
          strength_type: string | null
          sample_type: string | null
          slump: string | null
          qty: number | null
          structure_list: string | null
        }
        Insert: {
          id?: number
          mixcode: string
          supplier?: string | null
          strength?: number | null
          strength_type?: string | null
          sample_type?: string | null
          slump?: string | null
          qty?: number | null
          structure_list?: string | null
        }
        Update: {
          id?: number
          mixcode?: string
          supplier?: string | null
          strength?: number | null
          strength_type?: string | null
          sample_type?: string | null
          slump?: string | null
          qty?: number | null
          structure_list?: string | null
        }
      }
      'Compression Machine': {
        Row: CompressionMachineRow
        Insert: CompressionMachineInsert
        Update: CompressionMachineUpdate
      }
      CST: {
        Row: CstRow
        Insert: CstInsert
        Update: CstUpdate
      }
      'ABC Code': {
        Row: {
          id: number
          abc_code1: number | null
          abc_code2: number | null
          abc_code3: number | null
          abc_code4: number | null
          full_abc: string | null
          description: string | null
        }
        Insert: {
          id?: number
          abc_code1?: number | null
          abc_code2?: number | null
          abc_code3?: number | null
          abc_code4?: number | null
          full_abc?: string | null
          description?: string | null
        }
        Update: {
          id?: number
          abc_code1?: number | null
          abc_code2?: number | null
          abc_code3?: number | null
          abc_code4?: number | null
          full_abc?: string | null
          description?: string | null
        }
      }
      'ABC Code1': {
        Row: { id: number; code_name: string; description: string | null }
        Insert: { id?: number; code_name: string; description?: string | null }
        Update: { id?: number; code_name?: string; description?: string | null }
      }
      'ABC Code2': {
        Row: { id: number; code_name: string; description: string | null }
        Insert: { id?: number; code_name: string; description?: string | null }
        Update: { id?: number; code_name?: string; description?: string | null }
      }
      'ABC Code3': {
        Row: { id: number; code_name: string; description: string | null }
        Insert: { id?: number; code_name: string; description?: string | null }
        Update: { id?: number; code_name?: string; description?: string | null }
      }
      'ABC Code4': {
        Row: { id: number; code_name: string; description: string | null }
        Insert: { id?: number; code_name: string; description?: string | null }
        Update: { id?: number; code_name?: string; description?: string | null }
      }
      'WBS Code': {
        Row: {
          id: number
          wbs1: number | null
          wbs2: number | null
          wbs3: number | null
          wbs4: number | null
          wbs5: number | null
          wbs6: number | null
          wbs7: number | null
          full_wbs: string | null
          description: string | null
        }
        Insert: {
          id?: number
          wbs1?: number | null
          wbs2?: number | null
          wbs3?: number | null
          wbs4?: number | null
          wbs5?: number | null
          wbs6?: number | null
          wbs7?: number | null
          full_wbs?: string | null
          description?: string | null
        }
        Update: {
          id?: number
          wbs1?: number | null
          wbs2?: number | null
          wbs3?: number | null
          wbs4?: number | null
          wbs5?: number | null
          wbs6?: number | null
          wbs7?: number | null
          full_wbs?: string | null
          description?: string | null
        }
      }
      WBS1: {
        Row: { id: number; code_name: string; description: string | null }
        Insert: { id?: number; code_name: string; description?: string | null }
        Update: { id?: number; code_name?: string; description?: string | null }
      }
      WBS2: {
        Row: { id: number; code_name: string; description: string | null }
        Insert: { id?: number; code_name: string; description?: string | null }
        Update: { id?: number; code_name?: string; description?: string | null }
      }
      WBS3: {
        Row: { id: number; code_name: string; description: string | null }
        Insert: { id?: number; code_name: string; description?: string | null }
        Update: { id?: number; code_name?: string; description?: string | null }
      }
      WBS4: {
        Row: { id: number; code_name: string; description: string | null }
        Insert: { id?: number; code_name: string; description?: string | null }
        Update: { id?: number; code_name?: string; description?: string | null }
      }
      WBS5: {
        Row: { id: number; code_name: string; description: string | null }
        Insert: { id?: number; code_name: string; description?: string | null }
        Update: { id?: number; code_name?: string; description?: string | null }
      }
      WBS6: {
        Row: { id: number; code_name: string; description: string | null }
        Insert: { id?: number; code_name: string; description?: string | null }
        Update: { id?: number; code_name?: string; description?: string | null }
      }
      WBS7: {
        Row: { id: number; code_name: string; description: string | null }
        Insert: { id?: number; code_name: string; description?: string | null }
        Update: { id?: number; code_name?: string; description?: string | null }
      }
      Request: {
        Row: {
          id: string
          status_id: number
          client_id: number | null
          location_id: number | null
          concrete_work_id: number | null
          structure_id: number | null
          structure_no: string | null
          mixcode_id: number | null
          abc_code_id: number | null
          wbs_code_id: number | null
          request_date: string | null
          request_time: string | null
          casting_date: string | null
          volume_request: number | null
          volume_dwg: number | null
          volume_actual: number | null
          volume_confirm: number | null
          volume_loss: number | null
          pct_loss: number | null
          sample_qty: number | null
          strength: number | null
          before_image: string | null
          after_image: string | null
          eslip_url: string | null
          checksheet_url: string | null
          remarks: string | null
          booked_by: string | null
          inspected_by: string | null
          approved_by: string | null
          rejected_by: string | null
          postponed_by: string | null
          cancelled_by: string | null
          confirmed_by: string | null
          booked_at: string | null
          inspected_at: string | null
          approved_at: string | null
          rejected_at: string | null
          postponed_at: string | null
          cancelled_at: string | null
          confirmed_at: string | null
          postpone_date: string | null
          postpone_time: string | null
          reason_postpone: string | null
          reason_reject: string | null
          reason_cancel: string | null
          booking_ok: boolean | null
        }
        Insert: {
          id?: string
          status_id?: number
          client_id?: number | null
          location_id?: number | null
          concrete_work_id?: number | null
          structure_id?: number | null
          structure_no?: string | null
          mixcode_id?: number | null
          abc_code_id?: number | null
          wbs_code_id?: number | null
          request_date?: string | null
          request_time?: string | null
          casting_date?: string | null
          volume_request?: number | null
          volume_dwg?: number | null
          volume_actual?: number | null
          volume_confirm?: number | null
          sample_qty?: number | null
          strength?: number | null
          before_image?: string | null
          after_image?: string | null
          eslip_url?: string | null
          checksheet_url?: string | null
          remarks?: string | null
          booked_by?: string | null
          booked_at?: string | null
        }
        Update: {
          id?: string
          status_id?: number
          client_id?: number | null
          location_id?: number | null
          concrete_work_id?: number | null
          structure_id?: number | null
          structure_no?: string | null
          mixcode_id?: number | null
          abc_code_id?: number | null
          wbs_code_id?: number | null
          request_date?: string | null
          request_time?: string | null
          casting_date?: string | null
          volume_request?: number | null
          volume_dwg?: number | null
          volume_actual?: number | null
          volume_confirm?: number | null
          sample_qty?: number | null
          strength?: number | null
          before_image?: string | null
          after_image?: string | null
          eslip_url?: string | null
          checksheet_url?: string | null
          remarks?: string | null
          inspected_by?: string | null
          approved_by?: string | null
          rejected_by?: string | null
          postponed_by?: string | null
          cancelled_by?: string | null
          confirmed_by?: string | null
          inspected_at?: string | null
          approved_at?: string | null
          rejected_at?: string | null
          postponed_at?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          postpone_date?: string | null
          postpone_time?: string | null
          reason_postpone?: string | null
          reason_reject?: string | null
          reason_cancel?: string | null
          booking_ok?: boolean | null
        }
      }
      Request_Log: {
        Row: {
          id: number
          request_id: string
          status_id: number | null
          action: string
          action_by: string | null
          note: string | null
          postpone_date: string | null
          postpone_time: string | null
          created_at: string
        }
        Insert: {
          id?: number
          request_id: string
          status_id?: number | null
          action: string
          action_by?: string | null
          note?: string | null
          postpone_date?: string | null
          postpone_time?: string | null
          created_at?: string
        }
        Update: { id?: number }
      }
    }
    Views: {
      CST_View: {
        Row: CstViewRow
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: {
      user_role: 'admin' | 'manager' | 'user'
    }
  }
}
