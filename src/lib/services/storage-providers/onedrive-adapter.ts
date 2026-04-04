/**
 * OneDrive Storage Provider Adapter — STUB
 *
 * OneDrive integration is planned but not yet implemented.
 * All methods throw a "coming soon" error.
 */

import type {
  StorageProviderAdapter,
  StorageCredentials,
  StorageFile,
} from "./types";

export class OneDriveAdapter implements StorageProviderAdapter {
  private static readonly NOT_IMPLEMENTED =
    "OneDrive integration coming soon. Please use Dropbox for now.";

  async connect(): Promise<StorageCredentials> {
    throw new Error(OneDriveAdapter.NOT_IMPLEMENTED);
  }

  async disconnect(): Promise<void> {
    throw new Error(OneDriveAdapter.NOT_IMPLEMENTED);
  }

  async listFiles(): Promise<StorageFile[]> {
    throw new Error(OneDriveAdapter.NOT_IMPLEMENTED);
  }

  async listFolders(): Promise<StorageFile[]> {
    throw new Error(OneDriveAdapter.NOT_IMPLEMENTED);
  }

  async downloadFile(): Promise<{ buffer: Buffer; name: string }> {
    throw new Error(OneDriveAdapter.NOT_IMPLEMENTED);
  }

  async getFileMetadata(): Promise<StorageFile> {
    throw new Error(OneDriveAdapter.NOT_IMPLEMENTED);
  }

  async validateConnection(): Promise<boolean> {
    return false;
  }
}
