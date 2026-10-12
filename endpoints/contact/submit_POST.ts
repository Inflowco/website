import { schema, OutputType } from "./submit_POST.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";

/**
 * Handles the POST request for contact form submissions.
 * Validates the input using the shared Zod schema and inserts the data into the database.
 */
export async function handle(request: Request) {
  try {
    // Use request.text() + superjson.parse to handle serialization correctly
    const text = await request.text();
    const json = superjson.parse(text);
    const result = schema.parse(json);

    // Insert the submission into the contactSubmissions table
    // Kysely handles the camelCase to snake_case mapping via the CamelCasePlugin
    const inserted = await db
      .insertInto('contactSubmissions')
      .values({
        name: result.name,
        email: result.email,
        company: result.company ?? null,
        phone: result.phone ?? null,
        serviceInterest: result.serviceInterest ?? null,
        message: result.message,
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    // Return a success response with the submission ID
    return new Response(
      superjson.stringify({ 
        id: inserted.id, 
        message: "Thank you for your inquiry. We will get back to you shortly." 
      } satisfies OutputType)
    );
  } catch (error) {
    console.error("[Contact Submit Error]:", error);
    
    const message = error instanceof Error ? error.message : "An unexpected error occurred while processing your request.";
    
    // Return a 400 error for validation or processing failures
    return new Response(
      superjson.stringify({ error: message }), 
      { status: 400 }
    );
  }
}