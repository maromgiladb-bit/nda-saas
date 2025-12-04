import fs from "fs";
import path from "path";

// Dynamic import wrapper to avoid AMD build issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let docusignModule: any = null;

export async function getDocuSignSDK() {
  if (!docusignModule) {
    docusignModule = await import("docusign-esign");
  }
  return docusignModule.default || docusignModule;
}

// Token cache
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Gets a valid DocuSign access token.
 * Uses cached token if still valid, otherwise generates a new one.
 */
export async function getDocuSignToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && tokenExpiry > now + 5 * 60 * 1000) {
    return cachedToken;
  }

  // Generate new token
  try {
    const docusign = await getDocuSignSDK();

    const IK = process.env.DOCUSIGN_INTEGRATION_KEY!;
    const USER_ID = process.env.DOCUSIGN_USER_ID!;
    const privateKeyPath = path.join(process.cwd(), "private.key");

    if (!IK || !USER_ID) {
      throw new Error("Missing DocuSign credentials in environment variables");
    }

    const apiClient = new docusign.ApiClient();
    apiClient.setOAuthBasePath(
      process.env.DOCUSIGN_ENV === "production"
        ? "account.docusign.com"
        : "account-d.docusign.com"
    );

    const privateKey = fs.readFileSync(privateKeyPath);

    const results = await apiClient.requestJWTUserToken(
      IK,
      USER_ID,
      "signature impersonation",
      privateKey,
      3600
    );

    cachedToken = results.body.access_token;
    tokenExpiry = now + results.body.expires_in * 1000;

    return cachedToken!;
  } catch (error: unknown) {
    const err = error as { response?: { body?: { error?: string } }; message?: string };
    if (err.response?.body?.error === "consent_required") {
      const IK = process.env.DOCUSIGN_INTEGRATION_KEY;
      const consentUrl = `https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${IK}&redirect_uri=https://www.docusign.com`;
      throw new Error(
        `DocuSign consent required. Please visit: ${consentUrl}`
      );
    }
    throw new Error(`DocuSign token generation failed: ${err.message || 'Unknown error'}`);
  }
}

/**
 * Creates a configured DocuSign API client with valid authentication
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDocuSignClient(): Promise<any> {
  const docusign = await getDocuSignSDK();
  const token = await getDocuSignToken();
  const apiClient = new docusign.ApiClient();

  apiClient.setBasePath(
    process.env.DOCUSIGN_ENV === "production"
      ? "https://na3.docusign.net/restapi"
      : "https://demo.docusign.net/restapi"
  );

  apiClient.addDefaultHeader("Authorization", `Bearer ${token}`);

  return apiClient;
}

/**
 * Gets the DocuSign account ID
 */
export function getDocuSignAccountId(): string {
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
  if (!accountId) {
    throw new Error("DOCUSIGN_ACCOUNT_ID not set in environment variables");
  }
  return accountId;
}
