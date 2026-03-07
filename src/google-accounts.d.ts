/** Type declarations for Google Identity Services (GIS) */

interface TokenClient {
  requestAccessToken(overrides?: { prompt?: string }): void;
  callback: (response: TokenResponse) => void;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  error?: string;
  error_description?: string;
}

interface Google {
  accounts: {
    oauth2: {
      initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
      }): TokenClient;
      revoke(token: string, done?: () => void): void;
    };
  };
}

interface Window {
  google?: Google;
}
