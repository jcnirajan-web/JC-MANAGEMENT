import { DriveDocument } from '../types';

const DRIVE_BASE = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

export interface DriveFolderInfo {
  rootId: string;
  subfolders: Record<string, string>;
}

export class GoogleDriveService {
  /**
   * Find or create the root app folder and subfolders:
   * / Documents, / Job Cards, / Bulk Uploads, / Reports, / Templates, / Archive
   */
  static async setupAppFolders(accessToken: string): Promise<DriveFolderInfo> {
    const rootName = 'JOB CARD MANAGEMENT SYSTEM';
    let rootId = await this.findFolder(accessToken, rootName);

    if (!rootId) {
      rootId = await this.createFolder(accessToken, rootName);
    }

    const folderNames = [
      'Documents',
      'Job Cards',
      'Bulk Uploads',
      'Reports',
      'Templates',
      'Archive',
    ];

    const subfolders: Record<string, string> = {};
    for (const name of folderNames) {
      let subId = await this.findFolder(accessToken, name, rootId);
      if (!subId) {
        subId = await this.createFolder(accessToken, name, rootId);
      }
      subfolders[name] = subId;
    }

    return { rootId, subfolders };
  }

  static async findFolder(accessToken: string, name: string, parentId?: string): Promise<string | null> {
    try {
      let q = `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      if (parentId) {
        q += ` and '${parentId}' in parents`;
      }
      const res = await fetch(`${DRIVE_BASE}?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.files && data.files.length > 0 ? data.files[0].id : null;
    } catch (e) {
      console.error('Find folder error:', e);
      return null;
    }
  }

  static async createFolder(accessToken: string, name: string, parentId?: string): Promise<string> {
    const metadata: any = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentId) {
      metadata.parents = [parentId];
    }

    const res = await fetch(DRIVE_BASE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!res.ok) {
      throw new Error(`Failed to create Drive folder ${name}: ${await res.text()}`);
    }

    const data = await res.json();
    return data.id;
  }

  /**
   * Upload file to Google Drive subfolder
   */
  static async uploadFile(
    accessToken: string,
    file: File,
    folderId?: string,
    description?: string
  ): Promise<DriveDocument> {
    const metadata = {
      name: file.name,
      description: description || 'Job Card Management System document',
      parents: folderId ? [folderId] : undefined,
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const fileReader = new FileReader();
    const fileDataPromise = new Promise<string>((resolve) => {
      fileReader.onload = () => resolve(fileReader.result as string);
      fileReader.readAsBinaryString(file);
    });
    const fileContent = await fileDataPromise;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${file.type || 'application/octet-stream'}\r\n` +
      'Content-Transfer-Encoding: binary\r\n\r\n' +
      fileContent +
      closeDelimiter;

    const res = await fetch(DRIVE_UPLOAD, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      throw new Error(`Drive upload error: ${await res.text()}`);
    }

    const uploaded = await res.json();

    return {
      id: uploaded.id,
      name: file.name,
      type: file.type || 'Document',
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: 'Current User',
      driveLink: `https://drive.google.com/file/d/${uploaded.id}/view`,
      fileSize: `${Math.round(file.size / 1024)} KB`,
    };
  }
}
