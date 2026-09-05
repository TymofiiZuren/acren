import type { JobStatus } from "./jobs";
import type { RateInput } from "./rates";
import type { BillingProfile, Invoice } from "./billing";
import type { WorkRecommendation, ClientWorkBalance } from "./advisor";

export type Rate = RateInput & { id: string; consultant_id: string; retired: boolean; created_at: string; retired_at: string | null };

export type Job = {
  id: string; client_id: string; consultant_id: string; title: string;
  target_date: string | null; status: JobStatus; version: number;
  created_at: string; updated_at: string;
};

export type Client = {
  id: string;
  consultant_id: string;
  name: string;
  herd_number: string;
  county: string;
  phone: string;
  email: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      work_recommendations: {Row:WorkRecommendation;Insert:never;Update:never;Relationships:[]};
      billing_profiles: { Row: BillingProfile; Insert: Omit<BillingProfile,"consultant_id"> & {consultant_id?:string}; Update: Partial<Omit<BillingProfile,"consultant_id">>; Relationships: [] };
      invoices: { Row: Invoice; Insert: never; Update: never; Relationships: [] };
      invoice_events: { Row: {id:string;invoice_id:string;consultant_id:string;action:string;occurred_at:string}; Insert:never; Update:never; Relationships:[] };
      rates: {
        Row: Rate;
        Insert: RateInput & { id?: string; consultant_id?: string };
        Update: { retired?: boolean };
        Relationships: [];
      };
      rate_events: {
        Row: { id: string; rate_id: string; consultant_id: string; action: "created" | "retired"; occurred_at: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      jobs: {
        Row: Job;
        Insert: Pick<Job, "client_id" | "title" | "target_date"> & { id?: string; consultant_id?: string };
        Update: Partial<Pick<Job, "status">>;
        Relationships: [];
      };
      job_events: {
        Row: { id: string; job_id: string; client_id: string; consultant_id: string; status: JobStatus; version: number; occurred_at: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      clients: {
        Row: Client;
        Insert: Omit<Client, "id" | "created_at" | "updated_at" | "archived_at" | "consultant_id"> & {
          id?: string;
          consultant_id?: string;
        };
        Update: Partial<Pick<Client, "name" | "herd_number" | "county" | "phone" | "email" | "archived_at">>;
        Relationships: [];
      };
      client_events: {
        Row: { id: string; client_id: string; consultant_id: string; action: "created" | "updated" | "archived" | "restored"; changed_fields: string[]; occurred_at: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      recommend_work: {Args:{p_id:string;p_client_id:string;p_title:string;p_rate_id:string;p_quantity:number};Returns:string};
      client_work_balance: {Args:{p_client_id:string};Returns:ClientWorkBalance|null};
      create_invoice_draft: {Args:{p_id:string;p_job_id:string;p_rate_id:string;p_quantity:number;p_customer_address:string;p_supply_date:string;p_due_date:string;p_vat_basis_points:number|null};Returns:string};
      transition_invoice: {Args:{p_id:string;p_action:string;p_paid_date:string|null};Returns:string};
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
