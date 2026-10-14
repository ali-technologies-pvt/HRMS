import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

/**
 * Universal MongoDB Atlas Sync API Route
 * Handles storage for text records:
 * - hrms_sync: tasks, attendance, announcements, requests, reports, projects, chat_groups, chat_messages
 * - hrms_users: corporate employees, managers, roles & credentials
 */

export async function GET(req: NextRequest) {
  try {
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ success: false, error: 'MongoDB Atlas not connected' }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const key = searchParams.get('key');

    // Case 1: Fetch all users
    if (action === 'users') {
      const usersCol = db.collection('hrms_users');
      const users = await usersCol.find({}, { projection: { _id: 0 } }).toArray();
      return NextResponse.json({ success: true, data: users });
    }

    // Case 2: Fetch single collection by key
    if (key) {
      const syncCol = db.collection('hrms_sync');
      const doc = await syncCol.findOne({ key }, { projection: { _id: 0, data: 1 } });
      return NextResponse.json({
        success: true,
        data: doc ? doc.data : null
      });
    }

    return NextResponse.json({ success: false, error: 'Missing key or action parameter' }, { status: 400 });
  } catch (err: any) {
    console.error('[API /api/sync GET Error]:', err);
    return NextResponse.json({ success: false, error: err.message || 'Database fetch failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ success: false, error: 'MongoDB Atlas not connected' }, { status: 503 });
    }

    const body = await req.json();

    // Case 1: Upsert single user
    if (body.action === 'users' && body.user) {
      const usersCol = db.collection('hrms_users');
      const user = body.user;
      await usersCol.updateOne(
        { id: user.id },
        { $set: { ...user, updated_at: new Date().toISOString() } },
        { upsert: true }
      );
      return NextResponse.json({ success: true, message: 'User synced to MongoDB Atlas' });
    }

    // Case 2: Bulk upsert users
    if (body.action === 'bulk_users' && Array.isArray(body.users)) {
      const usersCol = db.collection('hrms_users');
      const operations = body.users.map((u: any) => ({
        updateOne: {
          filter: { id: u.id },
          update: { $set: { ...u, updated_at: new Date().toISOString() } },
          upsert: true
        }
      }));
      if (operations.length > 0) {
        await usersCol.bulkWrite(operations);
      }
      return NextResponse.json({ success: true, message: `${operations.length} users synced to MongoDB Atlas` });
    }

    // Case 3: Sync collection key (tasks, attendance, chat, etc.)
    if (body.key && body.data !== undefined) {
      const syncCol = db.collection('hrms_sync');
      await syncCol.updateOne(
        { key: body.key },
        {
          $set: {
            key: body.key,
            data: body.data,
            updated_at: new Date().toISOString()
          }
        },
        { upsert: true }
      );
      return NextResponse.json({ success: true, message: `Key "${body.key}" synced to MongoDB Atlas` });
    }

    return NextResponse.json({ success: false, error: 'Invalid payload structure' }, { status: 400 });
  } catch (err: any) {
    console.error('[API /api/sync POST Error]:', err);
    return NextResponse.json({ success: false, error: err.message || 'Database upsert failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ success: false, error: 'MongoDB Atlas not connected' }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    if (action === 'users' && id) {
      const usersCol = db.collection('hrms_users');
      await usersCol.deleteOne({ id });
      return NextResponse.json({ success: true, message: `User ${id} removed from MongoDB Atlas` });
    }

    return NextResponse.json({ success: false, error: 'Invalid delete parameters' }, { status: 400 });
  } catch (err: any) {
    console.error('[API /api/sync DELETE Error]:', err);
    return NextResponse.json({ success: false, error: err.message || 'Database delete failed' }, { status: 500 });
  }
}
