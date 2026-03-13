export const secret = {
  DatabaseUrl: new sst.Secret("DatabaseUrl"),
  BetterAuthSecret: new sst.Secret("BetterAuthSecret"),
  FrontendUrl: new sst.Secret("FrontendUrl"),
  GoogleClientId: new sst.Secret("GoogleClientId"),
  GoogleClientSecret: new sst.Secret("GoogleClientSecret"),
  LinkedinClientId: new sst.Secret("LinkedinClientId"),
  LinkedinClientSecret: new sst.Secret("LinkedinClientSecret"),
};

export const allSecrets = Object.values(secret);
