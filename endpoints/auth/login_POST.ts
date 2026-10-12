import { schema } from './login_POST.schema';
import superjson from 'superjson';
import { db } from '../../helpers/db';
import { verifyPassword, generateToken } from '../../helpers/auth';

export async function handle(request: Request) {
  try {
    const text = await request.text();
    // Support both superjson and regular JSON
    // superjson wraps data in { json: ..., meta: ... } format
    let json;
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && 'json' in parsed) {
      // It's superjson format
      json = superjson.deserialize(parsed);
    } else {
      // It's regular JSON
      json = parsed;
    }
    const { email, password } = schema.parse(json);

    // Find user
    const user = await db.selectFrom('users')
      .select(['id', 'email', 'passwordHash', 'firstName', 'lastName', 'role', 'organizationId'])
      .where('email', '=', email.toLowerCase())
      .executeTakeFirst();

    if (!user) {
      return new Response(superjson.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify password
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return new Response(superjson.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate JWT
    const token = generateToken({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      organizationId: user.organizationId,
      role: user.role as 'admin' | 'manager' | 'viewer',
    });

    return new Response(superjson.stringify({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return new Response(superjson.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
