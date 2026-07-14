// src/lib/submissions.server.ts
//
// Server-only. Persists submissions to Lovable Cloud (Postgres) so it works
// on both the local dev server AND the deployed Cloudflare Worker edge
// runtime -- no node:fs, no local disk.
//
// Table: public.submissions (keyed by email). RLS is enabled with NO
// policies, so only server-side admin code (this file) can read/write it.
//
// Records are keyed by userId (the submitter's email).

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface SubmissionRecord {
  userId: string;
  dataA?: string;
  dataB?: string;
  aSavedAt?: string;
  bSavedAt?: string;
  confirmed?: boolean;
}

interface Row {
  email: string;
  data_a: string | null;
  data_b: string | null;
  a_saved_at: string | null;
  b_saved_at: string | null;
  confirmed: boolean | null;
}

function toRecord(row: Row): SubmissionRecord {
  return {
    userId: row.email,
    dataA: row.data_a ?? undefined,
    dataB: row.data_b ?? undefined,
    aSavedAt: row.a_saved_at ?? undefined,
    bSavedAt: row.b_saved_at ?? undefined,
    confirmed: row.confirmed ?? undefined,
  };
}

export async function getRecord(userId: string): Promise<SubmissionRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("submissions")
    .select("email, data_a, data_b, a_saved_at, b_saved_at, confirmed")
    .eq("email", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? toRecord(data as Row) : null;
}

export type SaveEntryResult =
  | { status: "saved"; slot: "A" | "B"; record: SubmissionRecord }
  | { status: "max_reached"; record: SubmissionRecord };

export async function saveEntry(userId: string, value: string): Promise<SaveEntryResult> {
  const now = new Date().toISOString();
  const existing = await getRecord(userId);

  // No row yet → first entry goes into slot A
  if (!existing) {
    const { data, error } = await supabaseAdmin
      .from("submissions")
      .insert({ email: userId, data_a: value, a_saved_at: now, updated_at: now })
      .select("email, data_a, data_b, a_saved_at, b_saved_at, confirmed")
      .single();
    if (error) throw error;
    return { status: "saved", slot: "A", record: toRecord(data as Row) };
  }

  // A filled, B empty → second entry goes into slot B and locks the record
  if (existing.dataB === undefined) {
    const { data, error } = await supabaseAdmin
      .from("submissions")
      .update({ data_b: value, b_saved_at: now, confirmed: true, updated_at: now })
      .eq("email", userId)
      .is("data_b", null) // guard against race: only fill if still empty
      .select("email, data_a, data_b, a_saved_at, b_saved_at, confirmed")
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      // Someone else beat us to slot B → treat as max reached
      const fresh = await getRecord(userId);
      return { status: "max_reached", record: fresh! };
    }
    return { status: "saved", slot: "B", record: toRecord(data as Row) };
  }

  // Both slots already used
  return { status: "max_reached", record: existing };
}
