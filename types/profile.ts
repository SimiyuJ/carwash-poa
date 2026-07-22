// /types/profile.ts

export interface Profile {
  id: string;

  email?: string | null;

  full_name?: string | null;

  role?: string | null;

  branch_id?: string | null;

  company_id?: string | null;

  carwash_id?: string | null;
}
