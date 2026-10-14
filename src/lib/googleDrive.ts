import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.file'];

export function getDriveClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return google.drive({ version: 'v3', auth: oauth2Client });
  }

  // Fallback to Service Account if present
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (email && privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: SCOPES
    });
    return google.drive({ version: 'v3', auth });
  }

  return null;
}

export async function uploadToGoogleDrive(options: {
  filename: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<{
  success: boolean;
  fileId?: string;
  directUrl?: string;
  viewUrl?: string;
  downloadUrl?: string;
  error?: string;
}> {
  const drive = getDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!drive) {
    return {
      success: false,
      error: 'Google Drive credentials (OAuth2 / Refresh Token) missing'
    };
  }

  try {
    const stream = new Readable();
    stream.push(options.buffer);
    stream.push(null);

    const fileMetadata: any = {
      name: options.filename,
      ...(folderId ? { parents: [folderId] } : {})
    };

    const media = {
      mimeType: options.mimeType,
      body: stream
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, webContentLink'
    });

    const fileId = response.data.id;
    if (!fileId) {
      return { success: false, error: 'Failed to retrieve file ID from Google Drive' };
    }

    // Set permission so images & files can be viewed by employees in HRMS
    try {
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });
    } catch (permErr) {
      console.warn('Note: Permission create notice:', permErr);
    }

    // Direct CDN thumbnail / embed URL for instant rendering in <img src="..." />
    const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
    const viewUrl = response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
    const downloadUrl = response.data.webContentLink || `https://drive.google.com/uc?export=download&id=${fileId}`;

    return {
      success: true,
      fileId,
      directUrl,
      viewUrl,
      downloadUrl
    };
  } catch (err: any) {
    console.error('Google Drive Upload Error:', err);
    return {
      success: false,
      error: err?.message || 'Unknown error uploading to Google Drive'
    };
  }
}
