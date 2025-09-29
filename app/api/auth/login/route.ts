import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    // Import at runtime only
    const { PrismaClient } = await import('@prisma/client');
    const bcrypt = await import('bcryptjs');
    const jwt = await import('jsonwebtoken');

    const prisma = new PrismaClient();

    const admin = await prisma.admin.findUnique({
      where: { username }
    });

    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    return NextResponse.json({
      token,
      admin: { id: admin.id, username: admin.username }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
