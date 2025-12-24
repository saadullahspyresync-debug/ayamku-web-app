// infra/web.ts

import { userPool, userPoolClient } from "./auth";
import { identityPool } from "./identitypool";
import { bucket } from "./storage";

export function WebStack(props: {
  storage: ReturnType<typeof import("./storage").StorageStack>;
  // auth: ReturnType<typeof import("./auth").AuthStack>;
  api: ReturnType<typeof import("./api").ApiStack>;
}) {
  const { storage, api } = props;

  // Get current AWS region
  const region = aws.getRegionOutput().name;

  // Create static site
  const customerFrontend = new sst.aws.StaticSite("CustomerFrontend", {
    path: "packages/customerFrontend",
    build: {
      command: "npm run build",
      output: "dist",
    },
    environment: {
      VITE_REGION: region,
      VITE_API_URL: api.api.url,
      VITE_BUCKET: bucket.name,
      VITE_USER_POOL_ID: userPool.id,
      VITE_IDENTITY_POOL_ID: identityPool.id,
      VITE_USER_POOL_CLIENT_ID: userPoolClient.id,
    },
  });

  const adminFrontend = new sst.aws.StaticSite("AdminFrontend", {
    path: "packages/adminFrontend",
    build: {
      command: "npm run build",
      output: "dist",
    },
    environment: {
      VITE_REGION: region,
      VITE_API_URL: api.api.url,
      VITE_BUCKET: bucket.name,
       VITE_USER_POOL_ID: userPool.id,
      VITE_IDENTITY_POOL_ID: identityPool.id,
      VITE_USER_POOL_CLIENT_ID: userPoolClient.id,
    },
  });

  

  return {
    customerFrontend,
    adminFrontend
  };
}