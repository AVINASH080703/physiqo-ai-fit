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
      body_metrics: {
        Row: {
          arm_cm: number | null
          chest_cm: number | null
          created_at: string
          hips_cm: number | null
          id: string
          logged_at: string
          notes: string | null
          user_id: string
          waist_cm: number | null
          weight_kg: number
        }
        Insert: {
          arm_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          hips_cm?: number | null
          id?: string
          logged_at?: string
          notes?: string | null
          user_id: string
          waist_cm?: number | null
          weight_kg: number
        }
        Update: {
          arm_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          hips_cm?: number | null
          id?: string
          logged_at?: string
          notes?: string | null
          user_id?: string
          waist_cm?: number | null
          weight_kg?: number
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          calories_burned: number | null
          created_at: string
          custom_name: string | null
          duration_min: number | null
          exercise_id: string | null
          id: string
          logged_at: string
          notes: string | null
          reps: number | null
          sets: number | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          calories_burned?: number | null
          created_at?: string
          custom_name?: string | null
          duration_min?: number | null
          exercise_id?: string | null
          id?: string
          logged_at?: string
          notes?: string | null
          reps?: number | null
          sets?: number | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          calories_burned?: number | null
          created_at?: string
          custom_name?: string | null
          duration_min?: number | null
          exercise_id?: string | null
          id?: string
          logged_at?: string
          notes?: string | null
          reps?: number | null
          sets?: number | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: Database["public"]["Enums"]["exercise_category"]
          created_at: string
          difficulty: string | null
          equipment: string | null
          id: string
          instructions: string | null
          met_value: number
          muscle_group: string | null
          name: string
        }
        Insert: {
          category: Database["public"]["Enums"]["exercise_category"]
          created_at?: string
          difficulty?: string | null
          equipment?: string | null
          id?: string
          instructions?: string | null
          met_value?: number
          muscle_group?: string | null
          name: string
        }
        Update: {
          category?: Database["public"]["Enums"]["exercise_category"]
          created_at?: string
          difficulty?: string | null
          equipment?: string | null
          id?: string
          instructions?: string | null
          met_value?: number
          muscle_group?: string | null
          name?: string
        }
        Relationships: []
      }
      food_items: {
        Row: {
          calcium_mg: number
          calories: number
          carbs_g: number
          category: Database["public"]["Enums"]["diet_category"]
          created_at: string
          fat_g: number
          fiber_g: number
          id: string
          iron_mg: number
          magnesium_mg: number
          name: string
          potassium_mg: number
          primary_nutrient: string | null
          protein_g: number
          serving_size_g: number
          sodium_mg: number
        }
        Insert: {
          calcium_mg?: number
          calories?: number
          carbs_g?: number
          category: Database["public"]["Enums"]["diet_category"]
          created_at?: string
          fat_g?: number
          fiber_g?: number
          id?: string
          iron_mg?: number
          magnesium_mg?: number
          name: string
          potassium_mg?: number
          primary_nutrient?: string | null
          protein_g?: number
          serving_size_g?: number
          sodium_mg?: number
        }
        Update: {
          calcium_mg?: number
          calories?: number
          carbs_g?: number
          category?: Database["public"]["Enums"]["diet_category"]
          created_at?: string
          fat_g?: number
          fiber_g?: number
          id?: string
          iron_mg?: number
          magnesium_mg?: number
          name?: string
          potassium_mg?: number
          primary_nutrient?: string | null
          protein_g?: number
          serving_size_g?: number
          sodium_mg?: number
        }
        Relationships: []
      }
      nutrition_logs: {
        Row: {
          calories: number
          carbs_g: number
          created_at: string
          custom_name: string | null
          fat_g: number
          food_item_id: string | null
          id: string
          logged_at: string
          meal: Database["public"]["Enums"]["meal_type"]
          protein_g: number
          servings: number
          user_id: string
        }
        Insert: {
          calories?: number
          carbs_g?: number
          created_at?: string
          custom_name?: string | null
          fat_g?: number
          food_item_id?: string | null
          id?: string
          logged_at?: string
          meal?: Database["public"]["Enums"]["meal_type"]
          protein_g?: number
          servings?: number
          user_id: string
        }
        Update: {
          calories?: number
          carbs_g?: number
          created_at?: string
          custom_name?: string | null
          fat_g?: number
          food_item_id?: string | null
          id?: string
          logged_at?: string
          meal?: Database["public"]["Enums"]["meal_type"]
          protein_g?: number
          servings?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_logs_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_targets: {
        Row: {
          calcium_mg: number
          calories: number
          carbs_g: number
          created_at: string
          fat_g: number
          fiber_g: number
          id: string
          iron_mg: number
          magnesium_mg: number
          notes: string | null
          potassium_mg: number
          protein_g: number
          source: string
          updated_at: string
          user_id: string
          water_ml: number
        }
        Insert: {
          calcium_mg?: number
          calories?: number
          carbs_g?: number
          created_at?: string
          fat_g?: number
          fiber_g?: number
          id?: string
          iron_mg?: number
          magnesium_mg?: number
          notes?: string | null
          potassium_mg?: number
          protein_g?: number
          source?: string
          updated_at?: string
          user_id: string
          water_ml?: number
        }
        Update: {
          calcium_mg?: number
          calories?: number
          carbs_g?: number
          created_at?: string
          fat_g?: number
          fiber_g?: number
          id?: string
          iron_mg?: number
          magnesium_mg?: number
          notes?: string | null
          potassium_mg?: number
          protein_g?: number
          source?: string
          updated_at?: string
          user_id?: string
          water_ml?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"] | null
          age: number | null
          created_at: string
          full_name: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          goal: Database["public"]["Enums"]["fitness_goal"] | null
          height_cm: number | null
          id: string
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          age?: number | null
          created_at?: string
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          goal?: Database["public"]["Enums"]["fitness_goal"] | null
          height_cm?: number | null
          id?: string
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          age?: number | null
          created_at?: string
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          goal?: Database["public"]["Enums"]["fitness_goal"] | null
          height_cm?: number | null
          id?: string
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          diet_preference: Database["public"]["Enums"]["diet_preference"]
          id: string
          unit_system: Database["public"]["Enums"]["unit_system"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          diet_preference?: Database["public"]["Enums"]["diet_preference"]
          id?: string
          unit_system?: Database["public"]["Enums"]["unit_system"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          diet_preference?: Database["public"]["Enums"]["diet_preference"]
          id?: string
          unit_system?: Database["public"]["Enums"]["unit_system"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          amount: number
          created_at: string
          id: string
          logged_at: string
          unit: Database["public"]["Enums"]["water_unit"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          logged_at?: string
          unit?: Database["public"]["Enums"]["water_unit"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          logged_at?: string
          unit?: Database["public"]["Enums"]["water_unit"]
          user_id?: string
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"]
          created_at: string
          goal: Database["public"]["Enums"]["fitness_goal"]
          id: string
          is_active: boolean
          name: string
          plan: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_level: Database["public"]["Enums"]["activity_level"]
          created_at?: string
          goal: Database["public"]["Enums"]["fitness_goal"]
          id?: string
          is_active?: boolean
          name: string
          plan: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"]
          created_at?: string
          goal?: Database["public"]["Enums"]["fitness_goal"]
          id?: string
          is_active?: boolean
          name?: string
          plan?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_level: "beginner" | "intermediate" | "advanced"
      diet_category:
        | "veg"
        | "non_veg"
        | "vegan"
        | "dairy"
        | "grain"
        | "fruit"
        | "nut_seed"
        | "beverage"
        | "supplement"
      diet_preference: "veg" | "non_veg" | "vegan"
      exercise_category: "strength" | "cardio" | "mobility" | "hiit" | "sports"
      fitness_goal: "fat_loss" | "muscle_gain" | "maintenance"
      gender_type: "male" | "female" | "other"
      meal_type: "breakfast" | "lunch" | "dinner" | "snack"
      unit_system: "metric" | "imperial"
      water_unit: "ml" | "oz"
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
      activity_level: ["beginner", "intermediate", "advanced"],
      diet_category: [
        "veg",
        "non_veg",
        "vegan",
        "dairy",
        "grain",
        "fruit",
        "nut_seed",
        "beverage",
        "supplement",
      ],
      diet_preference: ["veg", "non_veg", "vegan"],
      exercise_category: ["strength", "cardio", "mobility", "hiit", "sports"],
      fitness_goal: ["fat_loss", "muscle_gain", "maintenance"],
      gender_type: ["male", "female", "other"],
      meal_type: ["breakfast", "lunch", "dinner", "snack"],
      unit_system: ["metric", "imperial"],
      water_unit: ["ml", "oz"],
    },
  },
} as const
