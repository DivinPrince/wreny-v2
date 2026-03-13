export default $config({
  app(input) {
    return {
      name: "wreny",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          region: "us-east-1",
        },
        vercel: "4.6.1",
      },
    };
  },
  async run() {
    const outputs: Record<string, unknown> = {};
    const { readdirSync } = await import("fs");
    for (const value of readdirSync("./infra/")) {
      if (!value.endsWith(".ts") && !value.endsWith(".js")) continue;
      const result = await import("./infra/" + value);
      if (result.outputs) Object.assign(outputs, result.outputs);
    }
    return outputs;
  },
});
