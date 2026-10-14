import { NextRequest, NextResponse } from 'next/server';
import { uploadToGoogleDrive } from '@/lib/googleDrive';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // Case 1: JSON payload with Base64 data (e.g. Chat images, Profile avatars)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { base64, filename, mimeType } = body;

      if (!base64) {
        return NextResponse.json({ success: false, error: 'No base64 data provided' }, { status: 400 });
      }

      // Extract raw base64 data and mimeType if data URL
      let cleanBase64 = base64;
      let detectedMime = mimeType || 'image/jpeg';

      if (base64.startsWith('data:')) {
        const matches = base64.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          detectedMime = matches[1];
          cleanBase64 = matches[2];
        }
      }

      const buffer = Buffer.from(cleanBase64, 'base64');
      const safeFilename = filename || `upload-${Date.now()}.${detectedMime.split('/')[1] || 'jpg'}`;

      const uploadResult = await uploadToGoogleDrive({
        filename: safeFilename,
        mimeType: detectedMime,
        buffer
      });

      if (!uploadResult.success) {
        return NextResponse.json({ success: false, error: uploadResult.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        url: uploadResult.directUrl,
        viewUrl: uploadResult.viewUrl,
        downloadUrl: uploadResult.downloadUrl,
        fileId: uploadResult.fileId
      });
    }

    // Case 2: Multipart Form Data (standard file upload from input[type=file])
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ success: false, error: 'No file provided in form data' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadResult = await uploadToGoogleDrive({
        filename: file.name || `file-${Date.now()}`,
        mimeType: file.type || 'application/octet-stream',
        buffer
      });

      if (!uploadResult.success) {
        return NextResponse.json({ success: false, error: uploadResult.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        url: uploadResult.directUrl,
        viewUrl: uploadResult.viewUrl,
        downloadUrl: uploadResult.downloadUrl,
        fileId: uploadResult.fileId
      });
    }

    return NextResponse.json({ success: false, error: 'Unsupported Content-Type' }, { status: 400 });
  } catch (err: any) {
    console.error('Upload API route error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Server upload failed' }, { status: 500 });
  }
}
