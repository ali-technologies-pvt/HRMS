import { NextResponse } from 'next/server';
import { initialAnnouncements } from '@/lib/initialData';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: initialAnnouncements
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: 'Announcement broadcast recorded',
      announcement: {
        id: 'anc-' + Date.now().toString(36),
        ...body,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
