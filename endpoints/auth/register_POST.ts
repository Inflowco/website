import { schema } from './register_POST.schema';
import superjson from 'superjson';
import { db } from '../../helpers/db';
import { hashPassword, generateToken } from '../../helpers/auth';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function handle(request: Request) {
  try {
    const text = await request.text();
    const json = superjson.parse(text);
    const { email, password, firstName, lastName, companyName } = schema.parse(json);

    // Check if email already exists
    const existing = await db.selectFrom('users')
      .select('id')
      .where('email', '=', email.toLowerCase())
      .executeTakeFirst();

    if (existing) {
      return new Response(superjson.stringify({ error: 'Email already registered' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create organization
    let slug = slugify(companyName);
    const existingOrg = await db.selectFrom('organizations')
      .select('id')
      .where('slug', '=', slug)
      .executeTakeFirst();

    if (existingOrg) {
      slug = `${slug}-${Date.now()}`;
    }

    const org = await db.insertInto('organizations')
      .values({
        name: companyName,
        slug,
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    // Create user
    const passwordHash = await hashPassword(password);
    const user = await db.insertInto('users')
      .values({
        organizationId: org.id,
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        role: 'admin', // First user is admin
      })
      .returning(['id', 'email', 'firstName', 'lastName', 'role', 'organizationId'])
      .executeTakeFirstOrThrow();

    // Create default facility
    const facility = await db.insertInto('facilities')
      .values({
        organizationId: org.id,
        name: 'Main Facility',
        timezone: 'America/New_York',
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    // Give user access to facility
    await db.insertInto('userFacilityAccess')
      .values({
        userId: user.id,
        facilityId: facility.id,
        accessLevel: 'full',
      })
      .execute();

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
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return new Response(superjson.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
