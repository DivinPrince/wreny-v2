export const domain =
  {
    production: "wreny.app",
    dev: "dev.wreny.app",
  }[$app.stage] || `${$app.stage}.dev.wreny.app`;
