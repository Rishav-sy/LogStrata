export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ClusterProvider = "kubernetes" | "eks" | "gke" | "aks" | "local";
export type ClusterEnvironment = "development" | "staging" | "production";
export type ClusterStatus =
  | "draft"
  | "onboarding"
  | "ready"
  | "degraded"
  | "offline"
  | "archived";

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

type ScenarioRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  configuration: Json;
  created_at: string;
  updated_at: string;
};

type ClusterRow = {
  id: string;
  user_id: string;
  name: string;
  provider: ClusterProvider;
  environment: ClusterEnvironment;
  status: ClusterStatus;
  connection_metadata: Json;
  onboarding_step: number;
  last_status_change_at: string;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Pick<ProfileRow, "id"> & Partial<Omit<ProfileRow, "id">>;
        Update: Partial<Omit<ProfileRow, "id" | "created_at">>;
        Relationships: [];
      };
      saved_scenarios: {
        Row: ScenarioRow;
        Insert: Pick<ScenarioRow, "user_id" | "name" | "configuration"> &
          Partial<Omit<ScenarioRow, "user_id" | "name" | "configuration">>;
        Update: Partial<Omit<ScenarioRow, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      clusters: {
        Row: ClusterRow;
        Insert: Pick<ClusterRow, "user_id" | "name" | "provider" | "environment"> &
          Partial<Omit<ClusterRow, "user_id" | "name" | "provider" | "environment">>;
        Update: Partial<Omit<ClusterRow, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      cluster_provider: ClusterProvider;
      cluster_environment: ClusterEnvironment;
      cluster_status: ClusterStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
