/**
 * Storage Provider Abstraction — Type Definitions
 *
 * Supports multiple cloud storage providers (Dropbox, Google Drive, OneDrive)
 * behind a common interface. New providers implement StorageProviderAdapter.
 */

export type StorageProvider = "dropbox" | "google_drive" | "onedrive";

export interface StorageCredentials {
  provider: StorageProvider;
  access_token: string;
  refresh_token?: string;
  account_id?: string;
  connected_at: string;
}

export interface StorageFile {
  id: string;
  name: string;
  path: string;
  modified_at: string;
  size: number;
  is_folder: boolean;
  content_hash?: string;
}

/**
 * All storage providers must implement this interface.
 * Existing Dropbox code has been wrapped in the DropboxAdapter.
 * Google Drive and OneDrive are stubs for now.
 */
export interface StorageProviderAdapter {
  /** Exchange an OAuth authorization code for credentials */
  connect(authCode: string, redirectUri: string): Promise<StorageCredentials>;

  /** Revoke tokens / disconnect */
  disconnect(): Promise<void>;

  /** List files in a folder (non-recursive) */
  listFiles(folderPath: string): Promise<StorageFile[]>;

  /** List only folders at a path (for the folder browser) */
  listFolders(parentPath?: string): Promise<StorageFile[]>;

  /** Download a file and return its contents as a Buffer */
  downloadFile(filePath: string): Promise<{ buffer: Buffer; name: string }>;

  /** Get metadata for a single file */
  getFileMetadata(filePath: string): Promise<StorageFile>;

  /** Validate that the current credentials are still valid */
  validateConnection(): Promise<boolean>;
}

/**
 * A stored connection record from tenant_storage_connections.
 */
export interface StorageConnection {
  id: string;
  tenant_id: string;
  provider: StorageProvider;
  credentials: StorageCredentials;
  is_primary: boolean;
  connected_at: string;
  connected_by: string | null;
  status: "active" | "expired" | "disconnected";
}

/** Display names for providers */
export const PROVIDER_LABELS: Record<StorageProvider, string> = {
  dropbox: "Dropbox",
  google_drive: "Google Drive",
  onedrive: "OneDrive",
};

/** Which providers are currently implemented (not stubs) */
export const AVAILABLE_PROVIDERS: StorageProvider[] = ["dropbox"];
export const COMING_SOON_PROVIDERS: StorageProvider[] = ["google_drive", "onedrive"];
