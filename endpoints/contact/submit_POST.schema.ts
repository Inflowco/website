import { z } from "zod";
import superjson from 'superjson';

/**
 * Zod schema for validating contact form submissions.
 * Shared between frontend and backend.
 */
export const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  phone: z.string().optional(),
  serviceInterest: z.string().optional(),
  message: z.string().min(1, "Message is required"),
});

export type InputType = z.infer<typeof schema>;

/**
 * Output type for the contact submission endpoint.
 */
export type OutputType = {
  id: number;
  message: string;
};

/**
 * Client-side fetcher for the contact submission endpoint.
 * Uses superjson for consistent serialization.
 */
export const postContactSubmit = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/contact/submit`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }

  return superjson.parse<OutputType>(await result.text());
};