export const secret = {
  DatabaseUrl: new sst.Secret("DatabaseUrl"),
  BetterAuthSecret: new sst.Secret("BetterAuthSecret"),
  FrontendUrl: new sst.Secret("FrontendUrl"),
  GoogleClientId: new sst.Secret("GoogleClientId"),
  GoogleClientSecret: new sst.Secret("GoogleClientSecret"),
  LinkedinClientId: new sst.Secret("LinkedinClientId"),
  LinkedinClientSecret: new sst.Secret("LinkedinClientSecret"),
  GoogleVertexApiKey: new sst.Secret("GoogleVertexApiKey"),
  /** Relevance Stack `YOUR_API_KEY` → `RELEVANCE_LINKEDIN_IMPORT_API_KEY` on the API Lambda. */
  RelevanceLinkedInImportApiKey: new sst.Secret("RelevanceLinkedInImportApiKey"),
};

export const allSecrets = Object.values(secret);
