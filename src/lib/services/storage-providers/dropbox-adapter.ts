/**
 * Dropbox Storage Provider Adapter
 *
 * Wraps the existing Dropbox API utilities (src/lib/dropbox.ts) behind
 * the StorageProviderAdapter interface. All existing Dropbox functionality
 * is preserved — this is a thin adapter, not a rewrite.
 */

import {
  exchangeCodeForTokens,
  refreshAccessToken,
  getDropboxAccount,
  listFolder,
  downloadFile as dropboxDownload,
  type DropboxEntry,
} from "@/lib/dropbox";
import type {
  StorageProviderAdapter,
  StorageCredentials,
  StorageFile,
} from "./types";

/**
 * Convert a Dropbox API entry to a generic StorageFile.
 */
function toStorageFile(entry: DropboxEntry): StorageFile {
  return {
    id: entry.id,
    name: entry.name,
    path: entry.path_lower || entry.path_display,
    modified_at: entry.server_modified || new Date().toISOString(),
    size: entry.size || 0,
    is_folder: entry[".tag"] === "folder",
    content_hash: entry.server_modified, // Dropbox uses server_modified for change detection
  };
}

export class DropboxAdapter implements StorageProviderAdapter {
  private accessToken: string;
  private refreshToken?: string;

  constructor(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  /**
   * Exchange an OAuth authorization code for Dropbox credentials.
   * This is a static-style method — the adapter doesn't need to be
   * pre-initialized with tokens to call connect().
   */
  async connect(
    authCode: string,
    redirectUri: string
  ): Promise<StorageCredentials> {
    const tokens = await exchangeCodeForTokens(authCode, redirectUri);

    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;

    return {
      provider: "dropbox",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      account_id: tokens.account_id,
      connected_at: new Date().toISOString(),
    };
  }

  async disconnect(): Promise<void> {
    // Dropbox doesn't have a revoke endpoint we use — just clear local state
    this.accessToken = "";
    this.refreshToken = undefined;
  }

  async listFiles(folderPath: string): Promise<StorageFile[]> {
    const token = await this.getValidToken();
    const entries = await listFolder(token, folderPath);
    return entries.map(toStorageFile);
  }

  async listFolders(parentPath?: string): Promise<StorageFile[]> {
    const token = await this.getValidToken();
    const entries = await listFolder(token, parentPath || "/");
    return entries
      .filter((e: DropboxEntry) => e[".tag"] === "folder")
      .map(toStorageFile);
  }

  async downloadFile(
    filePath: string
  ): Promise<{ buffer: Buffer; name: string }> {
    const token = await this.getValidToken();
    return dropboxDownload(token, filePath);
  }

  async getFileMetadata(filePath: string): Promise<StorageFile> {
    // Dropbox doesn't have a single-file metadata call we use currently.
    // List the parent folder and find the file.
    const parentPath = filePath.substring(0, filePath.lastIndexOf("/")) || "/";
    const files = await this.listFiles(parentPath);
    const found = files.find(
      (f) => f.path === filePath.toLowerCase() || f.name === filePath.split("/").pop()
    );
    if (!found) throw new Error(`File not found: ${filePath}`);
    return found;
  }

  async validateConnection(): Promise<boolean> {
    try {
      const token = await this.getValidToken();
      await getDropboxAccount(token);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the current access token, refreshing if expired.
   * Returns the (possibly new) access token.
   */
  async getValidToken(): Promise<string> {
    try {
      await getDropboxAccount(this.accessToken);
      return this.accessToken;
    } catch {
      // Token may be expired — try refreshing
      if (!this.refreshToken) {
        throw new Error("Dropbox access token expired and no refresh token available");
      }
      this.accessToken = await refreshAccessToken(this.refreshToken);
      return this.accessToken;
    }
  }

  /** Expose tokens for callers that need to persist them after refresh */
  get currentAccessToken(): string {
    return this.accessToken;
  }

  get currentRefreshToken(): string | undefined {
    return this.refreshToken;
  }
}
