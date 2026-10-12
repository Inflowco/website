import { z } from 'zod';
import superjson from 'superjson';

export const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  companyName: z.string().min(1, 'Company name is required'),
});

export type InputType = z.infer<typeof schema>;

export interface OutputType {
  token: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId: number;
  };
}

export async function register(data: InputType): Promise<OutputType> {
  const response = await fetch('/_api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: superjson.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }

  return superjson.parse(await response.text());
}
