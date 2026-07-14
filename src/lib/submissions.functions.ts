// src/lib/submissions.functions.ts
//
// Thin client-safe wrappers around the server-only helpers in
// ./submissions.server. Components import these; the .handler() bodies
// are stripped from client bundles by the TanStack server-fn transform.
//
// The submitter's email is the userId. No auth: this form is anonymous.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().email();

export const getSubmission = createServerFn({ method: "GET" })
  .inputValidator((input: { email: string }) =>
    z.object({ email: emailSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const { getRecord } = await import("./submissions.server");
    return getRecord(data.email);
  });

export const saveEntry = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; value: string }) =>
    z.object({ email: emailSchema, value: z.string().min(1).max(4096) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { saveEntry: save } = await import("./submissions.server");
    return save(data.email, data.value);
  });
