/**
 * Pure Google OAuth & Google Sheets Authentication Manager
 * 100% Standalone, Free, Client-side (NO Firebase required)
 */

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const OAUTH_CLIENT_ID = '167594352915-kbh0f0kovb7l42gu3shhgabtb87rcvhm.apps.googleusercontent.com';
const TOKEN_SESSION_KEY = 'jcms_google_access_token';

let cachedAccessToken: string | null = sessionStorage.getItem(TOKEN_SESSION_KEY);

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken || sessionStorage.getItem(TOKEN_SESSION_KEY);
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (token) {
    sessionStorage.setItem(TOKEN_SESSION_KEY, token);
  } else {
    sessionStorage.removeItem(TOKEN_SESSION_KEY);
  }
};

/**
 * Trigger standard Google OAuth 2.0 Implicit Token Flow using Google Identity Services
 */
export const googleSignIn = (): Promise<{ accessToken: string } | null> => {
  return new Promise((resolve, reject) => {
    // If Google GIS script is available
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: OAUTH_CLIENT_ID,
          scope: SCOPES.join(' '),
          callback: (response: any) => {
            if (response.access_token) {
              setAccessToken(response.access_token);
              resolve({ accessToken: response.access_token });
            } else if (response.error) {
              reject(new Error(response.error_description || response.error));
            } else {
              resolve(null);
            }
          },
          error_callback: (err: any) => {
            reject(new Error(err.message || 'Google Sign-in failed'));
          },
        });
        client.requestAccessToken();
        return;
      } catch (e) {
        console.warn('Google Identity Services client initialization error:', e);
      }
    }

    // Fallback: Prompt user to connect or authorize Google Sheets
    const tokenPrompt = prompt('Please enter your Google OAuth Access Token for Sheets sync (or leave blank to use Local DB):');
    if (tokenPrompt && tokenPrompt.trim()) {
      const cleanToken = tokenPrompt.trim();
      setAccessToken(cleanToken);
      resolve({ accessToken: cleanToken });
    } else {
      resolve(null);
    }
  });
};

export const googleLogout = async () => {
  setAccessToken(null);
};
