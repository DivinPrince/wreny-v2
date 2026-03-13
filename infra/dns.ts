export const domain =
  {
    production: "1000hills.spura.app",
    dev: "dev.1000hills.spura.app",
  }[$app.stage] || `${$app.stage}.dev.1000hills.spura.app`;
