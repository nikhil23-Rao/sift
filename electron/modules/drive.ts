import { ipcMain } from 'electron';

// Google Drive API Implementation using Fetch
// Documentation: https://developers.google.com/drive/api/v3/reference

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
}

async function driveFetch(endpoint: string, token: string, options: RequestInit = {}) {
  const response = await fetch(`${DRIVE_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google Drive API Error: ${error.error?.message || response.statusText}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function searchGoogleDrive(query: string, token: string) {
  // We use the 'q' parameter for searching. 
  // 'name contains' is case-sensitive in some contexts, so we can try to be more broad
  // or just ensure we are using the correct syntax for case-insensitive if possible.
  // Actually, for Drive API v3, 'name contains' is case-insensitive.
  // But let's also search in the full text to be sure.
  const q = encodeURIComponent(`(name contains '${query}' or fullText contains '${query}') and trashed = false`);
  const fields = 'files(id, name, mimeType, webViewLink, iconLink)';
  
  console.log(`[Drive] Searching for: ${query}`);
  const data = await driveFetch(`/files?q=${q}&fields=${fields}&pageSize=10`, token);
  
  const files = data.files as DriveFile[];
  console.log(`[Drive] Found ${files?.length || 0} files.`);
  
  return files || [];
}

export async function createDriveDocument(name: string, token: string) {
  // Creating a Google Doc requires specific mimeType
  const body = {
    name: name.endsWith('.docx') ? name.replace('.docx', '') : name,
    mimeType: 'application/vnd.google-apps.document',
  };

  return await driveFetch('/files?fields=id,name,mimeType,webViewLink,iconLink', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function deleteDriveFile(fileId: string, token: string) {
  // Permanent delete
  await driveFetch(`/files/${fileId}`, token, {
    method: 'DELETE',
  });
  return true;
}

export function setupDriveHandlers() {
  // IPC Handlers now require an accessToken passed from the renderer (which gets it from Firebase)
  
  ipcMain.handle('search-google-drive', async (_event, query: string, token: string) => {
    return await searchGoogleDrive(query, token);
  });

  ipcMain.handle('create-drive-document', async (_event, name: string, token: string) => {
    return await createDriveDocument(name, token);
  });

  ipcMain.handle('delete-drive-file', async (_event, fileId: string, token: string) => {
    return await deleteDriveFile(fileId, token);
  });
}
