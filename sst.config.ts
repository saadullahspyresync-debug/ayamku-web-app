/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "monorepo-template",
      // Set the removal policy based on the stage
      removal: input?.stage === "production" ? "retain" : "remove",
      // Specify the home region/provider
      home: "aws",
    };
  },
  async run() {
    // Dynamic imports for all stack files
    const { StorageStack } = await import("./infra/storage");
     await import("./infra/auth");
      const email = await import("./infra/email");
    const { ApiStack } = await import("./infra/api");
    const { WebStack } = await import("./infra/web");
     const { MonitoringStack } = await import("./infra/monitoring");

    // 1. Create Storage (no dependencies)
    const storage = StorageStack();
    
    // 2. Create Auth (depends on Storage for linking tables/buckets)
    // The result of this call MUST be the object containing userPool, or the app fails.
    // const auth = AuthStack(storage);
    const emailStack = email.EmailStack();
    
    // 3. Create API (depends on Storage and Auth)
    // This call passes the result from AuthStack directly.
    const api = ApiStack(storage, emailStack);
    
    // 4. Create Web (depends on all others to get output URLs/variables)
    // Deploy two frontends (customer + admin)
    const { customerFrontend, adminFrontend } = WebStack({ storage, api });

     // Add monitoring stack
    const monitoring = MonitoringStack({ api }); // NEW
    
    // Return the stack outputs
    return {
      storage,
      // auth,
      emailStack,
      api,
      customerFrontend,
      adminFrontend,
      monitoring
    };
  },
});
