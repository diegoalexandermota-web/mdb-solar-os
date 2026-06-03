export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      commissions: {
        Row: {
          commission_amount: number | null
          created_at: string
          customer_name: string | null
          deal_value: number | null
          expected_payout_date: string | null
          id: string
          lead_id: string | null
          milestone: Database["public"]["Enums"]["commission_milestone"]
          paid_date: string | null
          rep_id: string | null
          rep_name: string | null
          service_type: string | null
          status: Database["public"]["Enums"]["commission_status"]
          updated_at: string
        }
        Insert: {
          commission_amount?: number | null
          created_at?: string
          customer_name?: string | null
          deal_value?: number | null
          expected_payout_date?: string | null
          id?: string
          lead_id?: string | null
          milestone?: Database["public"]["Enums"]["commission_milestone"]
          paid_date?: string | null
          rep_id?: string | null
          rep_name?: string | null
          service_type?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string
        }
        Update: {
          commission_amount?: number | null
          created_at?: string
          customer_name?: string | null
          deal_value?: number | null
          expected_payout_date?: string | null
          id?: string
          lead_id?: string | null
          milestone?: Database["public"]["Enums"]["commission_milestone"]
          paid_date?: string | null
          rep_id?: string | null
          rep_name?: string | null
          service_type?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_scenarios: {
        Row: {
          apr: number | null
          created_at: string
          created_by: string | null
          dealer_fee: number | null
          down_payment: number | null
          escalator: number | null
          estimated_25_year_cost: number | null
          estimated_25_year_savings: number | null
          estimated_monthly_savings: number | null
          estimated_remaining_utility_bill: number | null
          id: string
          internal_notes: string | null
          is_recommended: boolean | null
          lead_id: string | null
          maintenance_included: boolean | null
          monthly_payment: number | null
          ownership_type: string | null
          program_type: string
          proposal_id: string | null
          provider: string
          qualification_notes: string | null
          scenario_name: string
          tax_credit_eligible: boolean | null
          term_years: number | null
          transferability_notes: string | null
          updated_at: string
        }
        Insert: {
          apr?: number | null
          created_at?: string
          created_by?: string | null
          dealer_fee?: number | null
          down_payment?: number | null
          escalator?: number | null
          estimated_25_year_cost?: number | null
          estimated_25_year_savings?: number | null
          estimated_monthly_savings?: number | null
          estimated_remaining_utility_bill?: number | null
          id?: string
          internal_notes?: string | null
          is_recommended?: boolean | null
          lead_id?: string | null
          maintenance_included?: boolean | null
          monthly_payment?: number | null
          ownership_type?: string | null
          program_type: string
          proposal_id?: string | null
          provider: string
          qualification_notes?: string | null
          scenario_name: string
          tax_credit_eligible?: boolean | null
          term_years?: number | null
          transferability_notes?: string | null
          updated_at?: string
        }
        Update: {
          apr?: number | null
          created_at?: string
          created_by?: string | null
          dealer_fee?: number | null
          down_payment?: number | null
          escalator?: number | null
          estimated_25_year_cost?: number | null
          estimated_25_year_savings?: number | null
          estimated_monthly_savings?: number | null
          estimated_remaining_utility_bill?: number | null
          id?: string
          internal_notes?: string | null
          is_recommended?: boolean | null
          lead_id?: string | null
          maintenance_included?: boolean | null
          monthly_payment?: number | null
          ownership_type?: string | null
          program_type?: string
          proposal_id?: string | null
          provider?: string
          qualification_notes?: string | null
          scenario_name?: string
          tax_credit_eligible?: boolean | null
          term_years?: number | null
          transferability_notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          activity_type: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          id: string
          lead_id: string
          message: string
          metadata: Json | null
        }
        Insert: {
          activity_type: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          id?: string
          lead_id: string
          message: string
          metadata?: Json | null
        }
        Update: {
          activity_type?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          message?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      lead_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_path: string | null
          file_size: number | null
          file_url: string
          id: string
          lead_id: string
          status: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_path?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          lead_id: string
          status?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          lead_id?: string
          status?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      lead_notes: {
        Row: {
          author_id: string | null
          author_name: string | null
          body: string
          created_at: string
          id: string
          lead_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          body: string
          created_at?: string
          id?: string
          lead_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          body?: string
          created_at?: string
          id?: string
          lead_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          address: string | null
          assigned_rep: string | null
          city: string | null
          created_at: string
          created_by: string | null
          credit_score_range: string | null
          customer_name: string
          email: string | null
          id: string
          last_contact_date: string | null
          lead_source: string | null
          monthly_bill: number | null
          next_follow_up_date: string | null
          notes: string | null
          phone: string | null
          pipeline_stage: Database["public"]["Enums"]["lead_stage"]
          priority: Database["public"]["Enums"]["lead_priority"]
          service_type: string | null
          state: string | null
          updated_at: string
          utility_company: string | null
        }
        Insert: {
          address?: string | null
          assigned_rep?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          credit_score_range?: string | null
          customer_name: string
          email?: string | null
          id?: string
          last_contact_date?: string | null
          lead_source?: string | null
          monthly_bill?: number | null
          next_follow_up_date?: string | null
          notes?: string | null
          phone?: string | null
          pipeline_stage?: Database["public"]["Enums"]["lead_stage"]
          priority?: Database["public"]["Enums"]["lead_priority"]
          service_type?: string | null
          state?: string | null
          updated_at?: string
          utility_company?: string | null
        }
        Update: {
          address?: string | null
          assigned_rep?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          credit_score_range?: string | null
          customer_name?: string
          email?: string | null
          id?: string
          last_contact_date?: string | null
          lead_source?: string | null
          monthly_bill?: number | null
          next_follow_up_date?: string | null
          notes?: string | null
          phone?: string | null
          pipeline_stage?: Database["public"]["Enums"]["lead_stage"]
          priority?: Database["public"]["Enums"]["lead_priority"]
          service_type?: string | null
          state?: string | null
          updated_at?: string
          utility_company?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          crew: string | null
          customer_name: string | null
          id: string
          inspection_date: string | null
          lead_id: string | null
          panel_count: number | null
          permit_number: string | null
          project_stage: string | null
          pto_date: string | null
          service_type: string | null
          system_size_kw: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          crew?: string | null
          customer_name?: string | null
          id?: string
          inspection_date?: string | null
          lead_id?: string | null
          panel_count?: number | null
          permit_number?: string | null
          project_stage?: string | null
          pto_date?: string | null
          service_type?: string | null
          system_size_kw?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          crew?: string | null
          customer_name?: string | null
          id?: string
          inspection_date?: string | null
          lead_id?: string | null
          panel_count?: number | null
          permit_number?: string | null
          project_stage?: string | null
          pto_date?: string | null
          service_type?: string | null
          system_size_kw?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          address: string | null
          battery_add_on: boolean | null
          created_at: string
          created_by: string | null
          customer_name: string | null
          estimated_25_year_cost: number | null
          estimated_25_year_savings: number | null
          estimated_monthly_savings: number | null
          estimated_panels: number | null
          estimated_payment: number | null
          estimated_system_size_kw: number | null
          financing_type: string | null
          id: string
          lead_id: string | null
          lease_option: boolean | null
          loan_option: boolean | null
          monthly_bill: number | null
          proposal_status: Database["public"]["Enums"]["proposal_status"]
          provider: string | null
          roof_hvac_add_on: boolean | null
          service_type: string | null
          updated_at: string
          utility_company: string | null
          water_add_on: boolean | null
        }
        Insert: {
          address?: string | null
          battery_add_on?: boolean | null
          created_at?: string
          created_by?: string | null
          customer_name?: string | null
          estimated_25_year_cost?: number | null
          estimated_25_year_savings?: number | null
          estimated_monthly_savings?: number | null
          estimated_panels?: number | null
          estimated_payment?: number | null
          estimated_system_size_kw?: number | null
          financing_type?: string | null
          id?: string
          lead_id?: string | null
          lease_option?: boolean | null
          loan_option?: boolean | null
          monthly_bill?: number | null
          proposal_status?: Database["public"]["Enums"]["proposal_status"]
          provider?: string | null
          roof_hvac_add_on?: boolean | null
          service_type?: string | null
          updated_at?: string
          utility_company?: string | null
          water_add_on?: boolean | null
        }
        Update: {
          address?: string | null
          battery_add_on?: boolean | null
          created_at?: string
          created_by?: string | null
          customer_name?: string | null
          estimated_25_year_cost?: number | null
          estimated_25_year_savings?: number | null
          estimated_monthly_savings?: number | null
          estimated_panels?: number | null
          estimated_payment?: number | null
          estimated_system_size_kw?: number | null
          financing_type?: string | null
          id?: string
          lead_id?: string | null
          lease_option?: boolean | null
          loan_option?: boolean | null
          monthly_bill?: number | null
          proposal_status?: Database["public"]["Enums"]["proposal_status"]
          provider?: string | null
          roof_hvac_add_on?: boolean | null
          service_type?: string | null
          updated_at?: string
          utility_company?: string | null
          water_add_on?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      solar_design_estimates: {
        Row: {
          annual_usage_kwh: number | null
          created_at: string
          created_by: string | null
          design_confidence: string | null
          desired_offset_percent: number | null
          estimated_annual_production_kwh: number | null
          estimated_monthly_production_kwh: number | null
          id: string
          lead_id: string | null
          monthly_usage_kwh: number | null
          panel_count: number | null
          panel_wattage: number | null
          proposal_id: string | null
          proposal_notes: string | null
          recommended_financing: string | null
          requires_final_design: boolean | null
          risk_flags: Json | null
          roof_condition: string | null
          roof_notes: string | null
          roof_type: string | null
          system_size_kw: number | null
          updated_at: string
          utility_rate_assumption: number | null
        }
        Insert: {
          annual_usage_kwh?: number | null
          created_at?: string
          created_by?: string | null
          design_confidence?: string | null
          desired_offset_percent?: number | null
          estimated_annual_production_kwh?: number | null
          estimated_monthly_production_kwh?: number | null
          id?: string
          lead_id?: string | null
          monthly_usage_kwh?: number | null
          panel_count?: number | null
          panel_wattage?: number | null
          proposal_id?: string | null
          proposal_notes?: string | null
          recommended_financing?: string | null
          requires_final_design?: boolean | null
          risk_flags?: Json | null
          roof_condition?: string | null
          roof_notes?: string | null
          roof_type?: string | null
          system_size_kw?: number | null
          updated_at?: string
          utility_rate_assumption?: number | null
        }
        Update: {
          annual_usage_kwh?: number | null
          created_at?: string
          created_by?: string | null
          design_confidence?: string | null
          desired_offset_percent?: number | null
          estimated_annual_production_kwh?: number | null
          estimated_monthly_production_kwh?: number | null
          id?: string
          lead_id?: string | null
          monthly_usage_kwh?: number | null
          panel_count?: number | null
          panel_wattage?: number | null
          proposal_id?: string | null
          proposal_notes?: string | null
          recommended_financing?: string | null
          requires_final_design?: boolean | null
          risk_flags?: Json | null
          roof_condition?: string | null
          roof_notes?: string | null
          roof_type?: string | null
          system_size_kw?: number | null
          updated_at?: string
          utility_rate_assumption?: number | null
        }
        Relationships: []
      }
      solar_design_layouts: {
        Row: {
          azimuth: number | null
          created_at: string
          created_by: string | null
          design_name: string | null
          equipment_summary: Json | null
          id: string
          irradiance_score: number | null
          layout_image_url: string | null
          layout_json: Json | null
          lead_id: string | null
          panel_count: number | null
          proposal_id: string | null
          roof_image_url: string | null
          shade_risk: string | null
          system_size_kw: number | null
          tilt: number | null
          updated_at: string
          view_type: string | null
        }
        Insert: {
          azimuth?: number | null
          created_at?: string
          created_by?: string | null
          design_name?: string | null
          equipment_summary?: Json | null
          id?: string
          irradiance_score?: number | null
          layout_image_url?: string | null
          layout_json?: Json | null
          lead_id?: string | null
          panel_count?: number | null
          proposal_id?: string | null
          roof_image_url?: string | null
          shade_risk?: string | null
          system_size_kw?: number | null
          tilt?: number | null
          updated_at?: string
          view_type?: string | null
        }
        Update: {
          azimuth?: number | null
          created_at?: string
          created_by?: string | null
          design_name?: string | null
          equipment_summary?: Json | null
          id?: string
          irradiance_score?: number | null
          layout_image_url?: string | null
          layout_json?: Json | null
          lead_id?: string | null
          panel_count?: number | null
          proposal_id?: string | null
          roof_image_url?: string | null
          shade_risk?: string | null
          system_size_kw?: number | null
          tilt?: number | null
          updated_at?: string
          view_type?: string | null
        }
        Relationships: []
      }
      solar_design_obstructions: {
        Row: {
          created_at: string
          design_layout_id: string
          height: number | null
          id: string
          notes: string | null
          obstruction_type: string | null
          shade_impact: string | null
          updated_at: string
          width: number | null
          x_position: number | null
          y_position: number | null
        }
        Insert: {
          created_at?: string
          design_layout_id: string
          height?: number | null
          id?: string
          notes?: string | null
          obstruction_type?: string | null
          shade_impact?: string | null
          updated_at?: string
          width?: number | null
          x_position?: number | null
          y_position?: number | null
        }
        Update: {
          created_at?: string
          design_layout_id?: string
          height?: number | null
          id?: string
          notes?: string | null
          obstruction_type?: string | null
          shade_impact?: string | null
          updated_at?: string
          width?: number | null
          x_position?: number | null
          y_position?: number | null
        }
        Relationships: []
      }
      solar_design_panels: {
        Row: {
          azimuth: number | null
          created_at: string
          design_layout_id: string
          id: string
          microinverter_model: string | null
          orientation: string | null
          panel_brand: string | null
          panel_model: string | null
          roof_plane: string | null
          rotation: number | null
          string_group: string | null
          tilt: number | null
          updated_at: string
          wattage: number | null
          x_position: number | null
          y_position: number | null
        }
        Insert: {
          azimuth?: number | null
          created_at?: string
          design_layout_id: string
          id?: string
          microinverter_model?: string | null
          orientation?: string | null
          panel_brand?: string | null
          panel_model?: string | null
          roof_plane?: string | null
          rotation?: number | null
          string_group?: string | null
          tilt?: number | null
          updated_at?: string
          wattage?: number | null
          x_position?: number | null
          y_position?: number | null
        }
        Update: {
          azimuth?: number | null
          created_at?: string
          design_layout_id?: string
          id?: string
          microinverter_model?: string | null
          orientation?: string | null
          panel_brand?: string | null
          panel_model?: string | null
          roof_plane?: string | null
          rotation?: number | null
          string_group?: string | null
          tilt?: number | null
          updated_at?: string
          wattage?: number | null
          x_position?: number | null
          y_position?: number | null
        }
        Relationships: []
      }
      solar_visual_previews: {
        Row: {
          confidence_level: string | null
          created_at: string
          created_by: string | null
          generated_preview_url: string | null
          id: string
          lead_id: string | null
          notes: string | null
          original_image_url: string | null
          panel_count: number | null
          proposal_id: string | null
          updated_at: string
          view_type: string | null
        }
        Insert: {
          confidence_level?: string | null
          created_at?: string
          created_by?: string | null
          generated_preview_url?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          original_image_url?: string | null
          panel_count?: number | null
          proposal_id?: string | null
          updated_at?: string
          view_type?: string | null
        }
        Update: {
          confidence_level?: string | null
          created_at?: string
          created_by?: string | null
          generated_preview_url?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          original_image_url?: string | null
          panel_count?: number | null
          proposal_id?: string | null
          updated_at?: string
          view_type?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          priority: Database["public"]["Enums"]["lead_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      utility_usage_records: {
        Row: {
          bill_amount: number | null
          created_at: string
          id: string
          kwh_usage: number | null
          lead_id: string
          month: number
          updated_at: string
          year: number
        }
        Insert: {
          bill_amount?: number | null
          created_at?: string
          id?: string
          kwh_usage?: number | null
          lead_id: string
          month: number
          updated_at?: string
          year: number
        }
        Update: {
          bill_amount?: number | null
          created_at?: string
          id?: string
          kwh_usage?: number | null
          lead_id?: string
          month?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "sales_rep" | "operations" | "customer"
      commission_milestone: "Contract" | "NTP" | "Install" | "PTO" | "Paid"
      commission_status: "Pending" | "Approved" | "Paid" | "Hold"
      lead_priority: "High" | "Medium" | "Low"
      lead_stage:
        | "New Lead"
        | "Contacted"
        | "Appointment Set"
        | "Proposal Sent"
        | "Credit Approved"
        | "Contract Signed"
        | "Site Survey"
        | "Permit"
        | "Install Scheduled"
        | "Installed"
        | "PTO"
        | "Commission Paid"
      proposal_status: "Draft" | "Sent" | "Viewed" | "Accepted" | "Declined"
      task_status: "open" | "in_progress" | "done"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "sales_rep", "operations", "customer"],
      commission_milestone: ["Contract", "NTP", "Install", "PTO", "Paid"],
      commission_status: ["Pending", "Approved", "Paid", "Hold"],
      lead_priority: ["High", "Medium", "Low"],
      lead_stage: [
        "New Lead",
        "Contacted",
        "Appointment Set",
        "Proposal Sent",
        "Credit Approved",
        "Contract Signed",
        "Site Survey",
        "Permit",
        "Install Scheduled",
        "Installed",
        "PTO",
        "Commission Paid",
      ],
      proposal_status: ["Draft", "Sent", "Viewed", "Accepted", "Declined"],
      task_status: ["open", "in_progress", "done"],
    },
  },
} as const
