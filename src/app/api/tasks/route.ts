import { NextResponse } from 'next/server';
import { initialTasks } from '@/lib/initialData';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: initialTasks
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: 'Task received and allocated',
      task: {
        id: 'task-' + Date.now().toString(36),
        ...body,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
