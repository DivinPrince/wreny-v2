export const secret = {
  DatabaseUrl: new sst.Secret("DatabaseUrl"),
  BetterAuthSecret: new sst.Secret("BetterAuthSecret"),
  FrontendUrl: new sst.Secret("FrontendUrl"),
  StripeSecret: new sst.Secret("StripeSecret"),
  StripeWebhookSecret: new sst.Secret("StripeWebhookSecret"),
};

export const allSecrets = Object.values(secret);
