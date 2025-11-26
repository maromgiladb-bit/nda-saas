declare module 'docusign-esign' {
  export class ApiClient {
    constructor();
    setOAuthBasePath(basePath: string): void;
    setBasePath(basePath: string): void;
    addDefaultHeader(name: string, value: string): void;
    requestJWTUserToken(
      clientId: string,
      userId: string,
      scopes: string | string[],
      privateKey: Buffer,
      expiresIn: number
    ): Promise<{
      body: {
        access_token: string;
        expires_in: number;
      };
    }>;
  }

  export class EnvelopesApi {
    constructor(apiClient: ApiClient);
    createEnvelope(
      accountId: string,
      options: { envelopeDefinition: EnvelopeDefinition }
    ): Promise<{ envelopeId: string; status: string }>;
  }

  export class EnvelopeDefinition {
    emailSubject?: string;
    status?: string;
    documents?: Document[];
    recipients?: Recipients;
  }

  export class Document {
    documentBase64?: string;
    name?: string;
    fileExtension?: string;
    documentId?: string;
  }

  export class Recipients {
    signers?: Signer[];
  }

  export class Signer {
    email?: string;
    name?: string;
    recipientId?: string;
    routingOrder?: string;
    tabs?: Tabs;
  }

  export class Tabs {
    signHereTabs?: SignHere[];
    dateSignedTabs?: DateSigned[];
    fullNameTabs?: FullName[];
  }

  export class SignHere {
    documentId?: string;
    pageNumber?: string;
    xPosition?: string;
    yPosition?: string;
  }

  export class DateSigned {
    documentId?: string;
    pageNumber?: string;
    xPosition?: string;
    yPosition?: string;
  }

  export class FullName {
    documentId?: string;
    pageNumber?: string;
    xPosition?: string;
    yPosition?: string;
  }
}
