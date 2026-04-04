/**
 * Storage Provider Factory
 *
 * Returns the appropriate StorageProviderAdapter based on the provider type.
 * Currently only Dropbox is fully implemented. Google Drive and OneDrive
 * return stub adapters that throw "coming soon" errors.
 */

export { type StorageProvider, type StorageCredentials, type StorageFile, type StorageProviderAdapter, type StorageConnection, PROVIDER_LABELS, AVAILABLE_PROVIDERS, COMING_SOON_PROVIDERS } from "./types";
export { DropboxAdapter } from "./dropbox-adapter";
export { GoogleDriveAdapter } from "./google-drive-adapter";
export { OneDriveAdapter } from "./onedrive-adapter";

import type { StorageProvider, StorageProviderAdapter } from "./types";
import { DropboxAdapter } from "./dropbox-adapter";
import { GoogleDriveAdapter } from "./google-drive-adapter";
import { OneDriveAdapter } from "./onedrive-adapter";

/**
 * Factory: get a storage adapter for the given provider.
 *
 * @param provider  The storage provider type
 * @param accessToken  The current access token (for Dropbox, this is the OAuth access token)
 * @param refreshToken  Optional refresh token
 */
export function getStorageAdapter(
  provider: StorageProvider,
  accessToken: string,
  refreshToken?: string
): StorageProviderAdapter {
  switch (provider) {
    case "dropbox":
      return new DropboxAdapter(accessToken, refreshToken);
    case "google_drive":
      return new GoogleDriveAdapter();
    case "onedrive":
      return new OneDriveAdapter();
    default:
      throw new Error(`Unsupported storage provider: ${provider}`);
  }
}

/**
 * Get storage credentials for a tenant from the tenant_storage_connections table.
 * Falls back to legacy dropbox_access_token/dropbox_refresh_token on the tenants table.
 */
export async function getTenantStorageCredentials(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  tenantId: string,
  provider?: StorageProvider
): Promise<{
  provider: StorageProvider;
  accessToken: string;
  refreshToken?: string;
  connectionId?: string;
} | null> {
  // Try the new storage connections table first
  let query = supabase
    .from("tenant_storage_connections")
    .select("id, provider, credentials, status")
    .eq("tenant_id", tenantId)
    .eq("status", "active");

  if (provider) {
    query = query.eq("provider", provider);
  } else {
    query = query.eq("is_primary", true);
  }

  const { data: connections } = await query.limit(1).maybeSingle();

  if (connections?.credentials) {
    const creds = connections.credentials as {
      access_token?: string;
      refresh_token?: string;
    };
    if (creds.access_token) {
      return {
        provider: connections.provider as StorageProvider,
        accessToken: creds.access_token,
        refreshToken: creds.refresh_token,
        connectionId: connections.id,
      };
    }
  }

  // Fallback: legacy Dropbox columns on tenants table
  const { data: tenant } = await supabase
    .from("tenants")
    .select("dropbox_access_token, dropbox_refresh_token")
    .eq("id", tenantId)
    .single();

  if (tenant?.dropbox_access_token) {
    return {
      provider: "dropbox",
      accessToken: tenant.dropbox_access_token,
      refreshToken: tenant.dropbox_refresh_token || undefined,
    };
  }

  return null;
}

/**
 * Persist updated tokens after a refresh, writing to both the new
 * storage connections table and the legacy tenants columns.
 */
export async function persistRefreshedToken(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  tenantId: string,
  newAccessToken: string,
  connectionId?: string
): Promise<void> {
  // Update legacy columns (for backward compatibility)
  await supabase
    .from("tenants")
    .update({ dropbox_access_token: newAccessToken })
    .eq("id", tenantId);

  // Update new storage connections table if we have a connection ID
  if (connectionId) {
    const { data: conn } = await supabase
      .from("tenant_storage_connections")
      .select("credentials")
      .eq("id", connectionId)
      .single();

    if (conn?.credentials) {
      const updatedCreds = {
        ...(conn.credentials as Record<string, unknown>),
        access_token: newAccessToken,
      };
      await supabase
        .from("tenant_storage_connections")
        .update({ credentials: updatedCreds })
        .eq("id", connectionId);
    }
  }
}
