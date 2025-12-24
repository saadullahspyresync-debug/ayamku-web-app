import { lambda } from '@pulumi/aws';
// infra/api.ts

import { userGroups, userPool, userPoolClient } from "./auth";
import { bucket } from "./storage";
// import * as sst from "sst"

export function ApiStack(
  storage: ReturnType<typeof import("./storage").StorageStack>,
  email: ReturnType<typeof import("./email").EmailStack>
) {
  // Default Lambda configuration with CloudWatch settings
  // const defaultFunctionProps = {
  //   runtime: "nodejs20.x" as const,
  //   logging: {
  //     retention: "1 week", // Options: "1 day", "3 days", "1 week", "2 weeks", "1 month", "2 months", "3 months", "4 months", "5 months", "6 months", "1 year"
  //     format: "json" as const, // Structured JSON logs for better CloudWatch Insights queries
  //   },
  //   // Optional: Add X-Ray tracing for better observability
  //   // Enable this if you want distributed tracing
  //   // tracing: "active" as const,
  // };
  const defaultFunctionProps = {
    runtime: "nodejs20.x" as const,
    logging: {
      retention: "1 week" as const,
      format: "json" as const,
    },
  };

  // Create API Gateway with CORS enabled
  const api = new sst.aws.ApiGatewayV2("Api", {
    cors: {
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowOrigins: [
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://localhost:8080",
        "https://gatelike-shyla-rustically.ngrok-free.dev",
        "https://d2871ozn3su384.cloudfront.net", // development
        "https://d28g469uwcbitn.cloudfront.net", // development
      ],
      allowHeaders: ["*"],
      // allowHeaders: [
      //   "Content-Type",
      //   "Authorization",
      //   "X-Amz-Date",
      //   "X-Api-Key",
      //   "X-Amz-Security-Token",
      // ],

      allowCredentials: true,
    },
  });

  // ============================new authorizer ========================
  // Custom Lambda Authorizer for Role-Based Access Control
  
  const oneNewAuthorizer = api.addAuthorizer({
    name: "RBACAuthorizerV4",  // RBACAuthorizer
    lambda: {
      function: {
        handler: "packages/functions/src/authorizer.main",
        link: [userPoolClient, userPool, userGroups, storage.tables.user],
        ...defaultFunctionProps,
      },
      ttl: "10 seconds",
    },
  });

  const protectedRouteConfig = {
    auth: { 
      lambda:oneNewAuthorizer.id,
    }
  };

// =================================================================================





  // Environment variables for auth lambda functions
  const authEnvironment = {
    USER_POOL_ID: userPool.id,
    USER_POOL_CLIENT_ID: userPoolClient.id,
    JWT_SECRET:
      process.env.JWT_SECRET || "your-dev-secret-change-in-production",
    JWT_REFRESH_SECRET:
      process.env.JWT_REFRESH_SECRET ||
      "your-dev-refresh-secret-change-in-production",
    NODE_ENV: process.env.NODE_ENV || "development",
    LOG_LEVEL: process.env.LOG_LEVEL || "info",
    EMAIL_TOPIC_ARN: email.emailTopic.arn,
  };

  // ✅ ADD THIS - Payment receipt route
  api.route("POST /payment-receipt", {
    handler: "packages/functions/src/secure-acceptance.handlePaymentReceipt",
    name: `${$app.name}-${$app.stage}-Payment-Receipt`,
    ...defaultFunctionProps,
  });

  // ✅ Also add GET method as fallback
  api.route("GET /payment-receipt", {
    handler: "packages/functions/src/secure-acceptance.handlePaymentReceipt",
    name: `${$app.name}-${$app.stage}-Payment-Receipt-GET`,
    ...defaultFunctionProps,
  });
  api.route(
    "POST /secure-acceptance",
    {
      handler: "packages/functions/src/secure-acceptance.main",
      name: `${$app.name}-${$app.stage}-Secure-Acceptance`,
      // link: [bucket],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  );

  api.route("POST /payment-webhook", {
    handler: "packages/functions/src/secure-acceptance.handleWebhook",
    name: `${$app.name}-${$app.stage}-Payment-Webhook`,
    // link: [bucket],
    ...defaultFunctionProps,
  });

  /// Admin CRUD Routes
  api.route("POST /admin", {
    handler: "packages/functions/src/admin.main",
    name: `${$app.name}-${$app.stage}-Create-Admin`,
    link: [userPool, storage.tables.user],
    ...defaultFunctionProps,
    permissions: [
      {
        actions: [
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminSetUserPassword",
          "cognito-idp:AdminAddUserToGroup",
        ],
        resources: [userPool.arn],
      },
    ],
  });

  api.route("GET /admin/{userId}", {
    handler: "packages/functions/src/admin.main",
    name: `${$app.name}-${$app.stage}-Get-Admin`,
    link: [userPool, storage.tables.user],
    ...defaultFunctionProps,
  });

  api.route("PUT /admin", {
    handler: "packages/functions/src/admin.main",
    name: `${$app.name}-${$app.stage}-Update-Admin`,
    link: [userPool, storage.tables.user],
    ...defaultFunctionProps,
    permissions: [
      {
        actions: [
          "cognito-idp:AdminUpdateUserAttributes",
          "cognito-idp:AdminGetUser",
        ],
        resources: [userPool.arn],
      },
    ],
  });

  api.route("DELETE /admin", {
    handler: "packages/functions/src/admin.main",
    name: `${$app.name}-${$app.stage}-Delete-Admin`,
    link: [userPool, storage.tables.user],
    ...defaultFunctionProps,
    permissions: [
      {
        actions: ["cognito-idp:AdminDeleteUser"],
        resources: [userPool.arn],
      },
    ],
  });
  // api.route("POST /createAdmin", {
  //   handler: "packages/functions/src/admin.main",
  //   name: `${$app.name}-${$app.stage}-Create-Admin`,
  // });

  // ======================
  // Public Auth Routes (No Authorization Required)
  // ======================
  api.route("POST /auth/register", {
    handler: "packages/functions/src/auth/register.main",
    name: `${$app.name}-${$app.stage}-Register-User`,
    link: [storage.tables.user],
    ...defaultFunctionProps,
    environment: authEnvironment,
  });

  api.route("POST /auth/syncUser", {
    handler: "packages/functions/src/auth/syncUser.main",
    name: `${$app.name}-${$app.stage}-Sync-User`,
    link: [storage.tables.user],
    ...defaultFunctionProps,
    environment: authEnvironment,
  });

  api.route("POST /auth/login", {
    handler: "packages/functions/src/auth/login.main",
    name: `${$app.name}-${$app.stage}-Login-User`,
    link: [storage.tables.user],
    ...defaultFunctionProps,
    environment: authEnvironment,
  });

  // api.route("POST /auth/confirm", {
  //   handler: "packages/functions/src/auth/confirm.main",
  //   link: [storage.tables.user],
  //   environment: authEnvironment,
  // });

  // api.route("POST /auth/resend-code", {
  //   handler: "packages/functions/src/auth/resendCode.main",
  //   environment: authEnvironment,
  // });

  // api.route("POST /auth/forgot-password", {
  //   handler: "packages/functions/src/auth/forgotPassword.main",
  //   environment: authEnvironment,
  // });

  // api.route("POST /auth/confirm-forgot-password", {
  //   handler: "packages/functions/src/auth/confirmForgotPassword.main",
  //   environment: authEnvironment,
  // });

  // ======================
  // Public Read-Only Routes (Anyone can view these)
  // ======================
  api.route("GET /branch", {
    handler: "packages/functions/src/branch/getAll.main",
    name: `${$app.name}-${$app.stage}-Get-All-Branches`,
    link: [storage.tables.branch],
    ...defaultFunctionProps,
  });

  api.route("GET /branch/{id}", {
    handler: "packages/functions/src/branch/getById.main",
    name: `${$app.name}-${$app.stage}-Get-Branch-ById`,
    link: [storage.tables.branch],
    ...defaultFunctionProps,
  });

  api.route("GET /sliders", {
    handler: "packages/functions/src/slider/getAll.main",
    name: `${$app.name}-${$app.stage}-Get-All-Sliders`,
    link: [storage.tables.slider],
    ...defaultFunctionProps,
  });

  api.route("GET /sliders/{id}", {
    handler: "packages/functions/src/slider/getById.main",
    name: `${$app.name}-${$app.stage}-Get-Slider-ById`,
    link: [storage.tables.slider],
    ...defaultFunctionProps,
  });

  api.route("GET /highlights", {
    handler: "packages/functions/src/highlight/getAll.main",
    name: `${$app.name}-${$app.stage}-Get-All-Highlights`,
    link: [storage.tables.seasonalHighlight],
    ...defaultFunctionProps,
  });

  api.route("GET /highlights/{id}", {
    handler: "packages/functions/src/highlight/getById.main",
    name: `${$app.name}-${$app.stage}-Get-Highlight-ById`,
    link: [storage.tables.seasonalHighlight],
    ...defaultFunctionProps,
  });

  api.route("GET /deals", {
    handler: "packages/functions/src/deal/getAll.main",
    name: `${$app.name}-${$app.stage}-Get-All-Deals`,
    link: [storage.tables.item],
    ...defaultFunctionProps,
  });

  api.route("GET /deals/{id}", {
    handler: "packages/functions/src/deal/getById.main",
    name: `${$app.name}-${$app.stage}-Get-Deal-ById`,
    link: [storage.tables.item],
    ...defaultFunctionProps,
  });

  api.route("GET /category", {
    handler: "packages/functions/src/category/getAll.main",
    name: `${$app.name}-${$app.stage}-Get-All-Categories`,
    link: [storage.tables.category],
    ...defaultFunctionProps,
  });

  api.route("GET /category/{id}", {
    handler: "packages/functions/src/category/getById.main",
    name: `${$app.name}-${$app.stage}-Get-Category-ById`,
    link: [storage.tables.category],
    ...defaultFunctionProps,
  });

  api.route("GET /items", {
    handler: "packages/functions/src/item/getAll.main",
    name: `${$app.name}-${$app.stage}-Get-All-Items`,
    link: [storage.tables.item],
    ...defaultFunctionProps,
  });

  api.route("GET /items/{id}", {
    handler: "packages/functions/src/item/getById.main",
    name: `${$app.name}-${$app.stage}-Get-Item-ById`,
    link: [storage.tables.item],
    ...defaultFunctionProps,
  });

  api.route("GET /items/branch/{branchId}", {
    handler: "packages/functions/src/item/getByBranch.main",
    name: `${$app.name}-${$app.stage}-GetItemsByBranch`,
    link: [storage.tables.item, storage.tables.category],
    ...defaultFunctionProps,
  });

  api.route("GET /promotions", {
    handler: "packages/functions/src/promotion/getAll.main",
    name: `${$app.name}-${$app.stage}-Get-All-Promotions`,
    link: [storage.tables.promotion],
    ...defaultFunctionProps,
  });

  api.route("GET /promotions/{id}", {
    handler: "packages/functions/src/promotion/getById.main",
    name: `${$app.name}-${$app.stage}-Get-Promotion-ById`,
    link: [storage.tables.promotion],
    ...defaultFunctionProps,
  });

  // NOTE: You can choose to protect these public GET routes as well if needed
  // by adding the `protectedRouteConfig` as the third argument.

  // ======================
  // Protected User Routes (Requires Authentication)
  // ======================
  api.route(
    "POST /auth/refresh",
    {
      handler: "packages/functions/src/auth/refresh.main",
      name: `${$app.name}-${$app.stage}-Refresh-Token`,
      link: [storage.tables.user],
      ...defaultFunctionProps,
      environment: authEnvironment,
    },
    protectedRouteConfig
  ); // PROTECTED

  api.route(
    "POST /auth/logout",
    {
      handler: "packages/functions/src/auth/logout.main",
      name: `${$app.name}-${$app.stage}-Logout`,
      environment: authEnvironment,
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  ); // PROTECTED

  // api.route("POST /auth/change-password", {
  //   handler: "packages/functions/src/auth/changePassword.main",
  //   environment: authEnvironment,
  // }, protectedRouteConfig); // PROTECTED

  // api.route("GET /me", {
  //   handler: "packages/functions/src/user/me.main",
  //   link: [storage.tables.user],
  //   environment: authEnvironment,
  // }, protectedRouteConfig); // PROTECTED

  api.route(
    "PUT /me",
    {
      handler: "packages/functions/src/user/update.main",
      name: `${$app.name}-${$app.stage}-Update-User`,
      link: [storage.tables.user],
      ...defaultFunctionProps,
      environment: authEnvironment,
    },
    protectedRouteConfig
  ); // PROTECTED

  // ✅ CORRECT - Pass the function resource itself
  api.route("POST /contact", {
    handler: "packages/functions/src/email/sendContactFormEmail.main",
    name: `${$app.name}-${$app.stage}-Contact-Form`,
    link: [storage.tables.contactForm],
    timeout: "30 seconds",
    ...defaultFunctionProps,
    environment: {
      SENDER_EMAIL: "saadullah.spyresync@gmail.com",
      RECIPIENT_EMAIL: "saadullah.spyresync@gmail.com", // Your support email
    },
    permissions: [
      {
        actions: ["ses:SendEmail", "ses:SendRawEmail"],
        resources: ["*"],
      },
    ],
  });

  api.route("GET /admin/contact", {
    handler: "packages/functions/src/adminContact/getAllContactMessages.main",
    name: `${$app.name}-${$app.stage}-GetAllContactMessages`,
    timeout: "30 seconds",
    link: [storage.tables.contactForm],
    ...defaultFunctionProps,
    permissions: [
      {
        actions: ["dynamodb:Scan"],
        resources: ["*"],
      },
    ],
  });

  api.route("PATCH /admin/contact/{id}/status", {
    handler: "packages/functions/src/adminContact/updateContactStatus.main",
    name: `${$app.name}-${$app.stage}-UpdateContactStatus`,
    timeout: "30 seconds",
    link: [storage.tables.contactForm],
    ...defaultFunctionProps,
    permissions: [
      {
        actions: ["dynamodb:UpdateItem"],
        resources: ["*"],
      },
    ],
  });

  api.route("DELETE /admin/contact/{id}", {
  handler: "packages/functions/src/adminContact/deleteContactMessage.main",
  name: `${$app.name}-${$app.stage}-DeleteContactMessage`,
  timeout: "30 seconds",
  link: [storage.tables.contactForm],
  ...defaultFunctionProps,
  permissions: [
    {
      actions: ["dynamodb:DeleteItem"],
      resources: ["*"],
    },
  ],
});

  // ======================
  // Protected Order Routes
  // ======================
  api.route(
    "POST /orders",
    {
      handler: "packages/functions/src/order/create.main",
      name: `${$app.name}-${$app.stage}-Create-Order`,
      link: [
        storage.tables.order,
        storage.tables.user,
        storage.tables.item,
        storage.tables.branch,
        storage.tables.pointsConfig,
        storage.tables.pointsTransaction,
        storage.tables.redemptionHistory,
        storage.tables.redeemableItem,
        email.emailTopic,
      ],
      ...defaultFunctionProps,
      environment: authEnvironment,
    },
    protectedRouteConfig
  ); // PROTECTED

  api.route(
    "GET /orders/my",
    {
      handler: "packages/functions/src/order/getMyOrders.main",
      name: `${$app.name}-${$app.stage}-Get-My-Orders`,
      link: [storage.tables.order],
      ...defaultFunctionProps,
      environment: authEnvironment,
    },
    protectedRouteConfig
  ); // PROTECTED

  // ======================
  // Protected Admin Routes (Authorizer will handle role checks)
  // ======================

  // User Management
  // api.route("GET /users", {
  //   handler: "packages/functions/src/admin/user/getAll.main",
  //   link: [storage.tables.user],
  //   environment: authEnvironment,
  // }, protectedRouteConfig); // PROTECTED

  // api.route("GET /users/{id}", {
  //   handler: "packages/functions/src/admin/user/getById.main",
  //   link: [storage.tables.user],
  //   environment: authEnvironment,
  // }, protectedRouteConfig); // PROTECTED

  // api.route("PATCH /users/{id}", {
  //   handler: "packages/functions/src/admin/user/update.main",
  //   link: [storage.tables.user],
  //   environment: authEnvironment,
  // }, protectedRouteConfig); // PROTECTED

  // api.route("DELETE /users/{id}", {
  //   handler: "packages/functions/src/admin/user/remove.main",
  //   link: [storage.tables.user],
  //   environment: authEnvironment,
  // }, protectedRouteConfig); // PROTECTED

  api.route(
    "POST /upload",
    {
      handler: "packages/functions/src/upload.main",
      name: `${$app.name}-${$app.stage}-Upload-File`,
      link: [bucket],
      ...defaultFunctionProps,
    },
    // protectedRouteConfig
  );

  api.route(
    "POST /deals",
    {
      handler: "packages/functions/src/deal/create.main",
      name: `${$app.name}-${$app.stage}-Create-Deal`,
      link: [storage.tables.item],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  ); // PROTECTED (already done)

  api.route(
    "PUT /deals/{id}",
    {
      handler: "packages/functions/src/deal/update.main",
      name: `${$app.name}-${$app.stage}-Update-Deal`,
      link: [storage.tables.item],
      ...defaultFunctionProps,
      // environment: authEnvironment,
    },
    protectedRouteConfig
  ); // PROTECTED

  api.route(
    "DELETE /deals/{id}",
    {
      handler: "packages/functions/src/deal/delete.main",
      name: `${$app.name}-${$app.stage}-Delete-Deal`,
      link: [storage.tables.item],
      ...defaultFunctionProps,
      // environment: authEnvironment,
    },
    protectedRouteConfig
  ); // PROTECTED

  api.route(
    "POST /sliders",
    {
      handler: "packages/functions/src/slider/create.main",
      name: `${$app.name}-${$app.stage}-Create-Slider`,
      link: [storage.tables.slider],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  ); // PROTECTED (already done)

  api.route(
    "PUT /sliders/{id}",
    {
      handler: "packages/functions/src/slider/update.main",
      name: `${$app.name}-${$app.stage}-Update-Slider`,
      link: [storage.tables.slider],
      ...defaultFunctionProps,
      // environment: authEnvironment,
    },
    protectedRouteConfig
  ); // PROTECTED

  api.route(
    "DELETE /sliders/{id}",
    {
      handler: "packages/functions/src/slider/delete.main",
      name: `${$app.name}-${$app.stage}-Delete-Slider`,
      link: [storage.tables.slider],
      ...defaultFunctionProps,
      // environment: authEnvironment,
    },
    protectedRouteConfig
  ); // PROTECTED

  api.route(
    "POST /highlights",
    {
      handler: "packages/functions/src/highlight/create.main",
      name: `${$app.name}-${$app.stage}-Create-Highlight`,
      link: [storage.tables.seasonalHighlight],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  ); // PROTECTED (already done)

  api.route(
    "PUT /highlights/{id}",
    {
      handler: "packages/functions/src/highlight/update.main",
      name: `${$app.name}-${$app.stage}-Update-Highlight`,
      link: [storage.tables.seasonalHighlight],
      ...defaultFunctionProps,
      // environment: authEnvironment,
    },
    protectedRouteConfig
  ); // PROTECTED

  api.route(
    "DELETE /highlights/{id}",
    {
      handler: "packages/functions/src/highlight/delete.main",
      name: `${$app.name}-${$app.stage}-Delete-Highlight`,
      link: [storage.tables.seasonalHighlight],
      ...defaultFunctionProps,
      // environment: authEnvironment,
    },
    protectedRouteConfig
  ); // PROTECTED

  //  new routes to auto delete promotions
//   new sst.aws.Cron("AutoDeleteExpiredHighlights", {
//   schedule: "rate(7 days)",
//   job: {
//     handler: "packages/functions/src/highlight/autoDelete.main",
//     link: [storage.tables.seasonalHighlight],
//   },
// });

  api.route(
    "POST /branch",
    {
      handler: "packages/functions/src/branch/create.main",
      name: `${$app.name}-${$app.stage}-Create-Branch`,
      link: [storage.tables.branch],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  ); // PROTECTED (already done)

  api.route(
    "DELETE /branch/{id}",
    {
      handler: "packages/functions/src/branch/delete.main",
      name: `${$app.name}-${$app.stage}-Delete-Branch`,
      link: [storage.tables.branch],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  ); // PROTECTED (already done)

  api.route(
    "PUT /branch/{id}",
    {
      handler: "packages/functions/src/branch/update.main",
      name: `${$app.name}-${$app.stage}-Update-Branch`,
      link: [storage.tables.branch],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  ); // PROTECTED (already done)

  api.route(
    "POST /category",
    {
      handler: "packages/functions/src/category/create.main",
      name: `${$app.name}-${$app.stage}-Create-Category`,
      link: [storage.tables.category],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  ); // PROTECTED (already done)

  api.route(
    "DELETE /category/{id}",
    {
      handler: "packages/functions/src/category/delete.main",
      name: `${$app.name}-${$app.stage}-Delete-Category`,
      link: [storage.tables.category],
      ...defaultFunctionProps,
      // environment: authEnvironment,
    },
    protectedRouteConfig
  ); // PROTECTED

  api.route(
    "PUT /category/{id}",
    {
      handler: "packages/functions/src/category/update.main",
      name: `${$app.name}-${$app.stage}-Update-Category`,
      link: [storage.tables.category],
      ...defaultFunctionProps,
      // environment: authEnvironment,
    },
    protectedRouteConfig
  ); // PROTECTED

  api.route(
    "POST /promotions",
    {
      handler: "packages/functions/src/promotion/create.main",
      name: `${$app.name}-${$app.stage}-Create-Promotion`,
      link: [storage.tables.promotion],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  ); // PROTECTED (already done)

  api.route(
    "PUT /promotions/{id}",
    {
      handler: "packages/functions/src/promotion/update.main",
      name: `${$app.name}-${$app.stage}-Update-Promotion`,
      link: [storage.tables.promotion],
      ...defaultFunctionProps,
      // environment: authEnvironment,
    },
    protectedRouteConfig
  ); // PROTECTED

  api.route(
    "DELETE /promotions/{id}",
    {
      handler: "packages/functions/src/promotion/delete.main",
      name: `${$app.name}-${$app.stage}-Delete-Promotion`,
      link: [storage.tables.promotion],
      ...defaultFunctionProps,
      // environment: authEnvironment,
    },
    protectedRouteConfig
  ); // PROTECTED


  //  new routes to auto delete promotions
  new sst.aws.Cron("AutoDeleteExpiredPromotions", {
  schedule: "rate(7 days)",
  job: {
    handler: "packages/functions/src/promotion/autoDelete.main",
    link: [storage.tables.promotion],
  },
});


  // Item Management
  api.route(
    "POST /items",
    {
      handler: "packages/functions/src/item/create.main",
      name: `${$app.name}-${$app.stage}-Create-Item`,
      link: [
        storage.tables.item,
        storage.tables.category,
        storage.tables.branch,
      ],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  ); // PROTECTED

  api.route(
    "PATCH /items/{id}",
    {
      handler: "packages/functions/src/item/update.main",
      name: `${$app.name}-${$app.stage}-Update-Item`,
      link: [storage.tables.item, storage.tables.category],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  ); // PROTECTED

  api.route(
    "DELETE /items/{id}",
    {
      handler: "packages/functions/src/item/delete.main",
      name: `${$app.name}-${$app.stage}-Delete-Item`,
      link: [storage.tables.item],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  ); // PROTECTED

  // And so on for all other admin routes...
  // (The pattern is the same for all routes below)

  // api.route("GET /orders", {
  //   handler: "packages/functions/src/order/getAll.main",
  //   link: [storage.tables.order],
  //   environment: authEnvironment,
  // }, protectedRouteConfig); // PROTECTED

  // api.route("PATCH /orders/{id}/status", {
  //   handler: "packages/functions/src/order/updateStatus.main",
  //   link: [storage.tables.order, storage.tables.activityLog],
  //   environment: authEnvironment,
  // }, protectedRouteConfig); // PROTECTED

  // ... etc. ... just continue this pattern for all remaining routes that need protection.

  // ======================
  // Points Configuration Routes (Admin Only)
  // ======================

  // Get points conversion rate and settings
  api.route(
    "GET /admin/points/config",
    {
      handler: "packages/functions/src/adminPoints/getConfig.main",
      name: `${$app.name}-${$app.stage}-GetPointsConfig`,
      link: [storage.tables.pointsConfig],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  );

  // Update points conversion rate
  api.route(
    "PUT /admin/points/config",
    {
      handler: "packages/functions/src/adminPoints/updateConfig.main",
      name: `${$app.name}-${$app.stage}-UpdatePointsConfig`,
      link: [storage.tables.pointsConfig],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  );

  // ======================
  // Order Management Routes (Admin Only)
  // ======================

  // Get All Orders
  api.route(
    "GET /admin/orders",
    {
      handler: "packages/functions/src/adminOrder/getAll.main",
      name: `${$app.name}-${$app.stage}-GetAllOrders`,
      link: [storage.tables.order, storage.tables.branch, storage.tables.user],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  );

  // Get Orders Stats
  api.route(
    "GET /admin/orders-stats",
    {
      handler: "packages/functions/src/adminOrder/getOrdersStats.main",
      name: `${$app.name}-${$app.stage}-GetOrdersStats`,
      link: [storage.tables.order],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  );

  // Get Single Order
  api.route(
    "GET /admin/orders/{id}",
    {
      handler: "packages/functions/src/adminOrder/getById.main",
      name: `${$app.name}-${$app.stage}-GetOrderById`,
      link: [storage.tables.order, storage.tables.branch, storage.tables.user],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  );

  // Update Order Status
  api.route(
    "PATCH /admin/orders/{id}/status",
    {
      handler: "packages/functions/src/adminOrder/updateStatus.main",
      name: `${$app.name}-${$app.stage}-UpdateOrderStatus`,
      link: [storage.tables.order, storage.tables.activityLog],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  );
  // Delete Order
  api.route(
    "DELETE /admin/orders/{id}",
    {
      handler: "packages/functions/src/adminOrder/delete.main",
      name: `${$app.name}-${$app.stage}-DeleteOrder`,
      link: [storage.tables.order],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  );

  // Update Order
  api.route(
    "PUT /admin/orders/{id}",
    {
      handler: "packages/functions/src/adminOrder/update.main",
      name: `${$app.name}-${$app.stage}-UpdateOrder`,
      link: [storage.tables.order],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  );

  // ======================
  // Redeemable Items Routes (Admin)
  // ======================

  // Get all redeemable items (with filters)
  api.route(
    "GET /admin/redeemables",
    {
      handler: "packages/functions/src/adminRedeemable/getAll.main",
      name: `${$app.name}-${$app.stage}-GetAllRedeemableItems`,
      link: [storage.tables.redeemableItem],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  );

  // Get single redeemable item
  api.route(
    "GET /admin/redeemables/{id}",
    {
      handler: "packages/functions/src/adminRedeemable/getById.main",
      name: `${$app.name}-${$app.stage}-GetRedeemableItemById`,
      link: [storage.tables.redeemableItem],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  );

  // Create redeemable item
  api.route(
    "POST /admin/redeemables",
    {
      handler: "packages/functions/src/adminRedeemable/create.main",
      name: `${$app.name}-${$app.stage}-CreateRedeemableItem`,
      link: [storage.tables.redeemableItem, storage.tables.branch],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  );

  // Update redeemable item
  api.route(
    "PUT /admin/redeemables/{id}",
    {
      handler: "packages/functions/src/adminRedeemable/update.main",
      name: `${$app.name}-${$app.stage}-UpdateRedeemableItem`,
      link: [storage.tables.redeemableItem, storage.tables.branch],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  );

  // Delete redeemable item
  api.route(
    "DELETE /admin/redeemables/{id}",
    {
      handler: "packages/functions/src/adminRedeemable/delete.main",
      name: `${$app.name}-${$app.stage}-DeleteRedeemableItem`,
      link: [storage.tables.redeemableItem],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  );

  // ======================
  // Redemption Analytics Routes (Admin)
  // ======================

  // Get redemption statistics
  api.route(
    "GET /admin/redemptions/stats",
    {
      handler: "packages/functions/src/redemption/getStats.main",
      name: `${$app.name}-${$app.stage}-GetRedemptionStats`,
      link: [storage.tables.redemptionHistory, storage.tables.redeemableItem],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  );

  // Get all redemptions with filters
  api.route(
    "GET /admin/redemptions",
    {
      handler: "packages/functions/src/redemption/getAll.main",
      name: `${$app.name}-${$app.stage}-GetAllRedemptions`,
      link: [
        storage.tables.redemptionHistory,
        storage.tables.user,
        storage.tables.redeemableItem,
      ],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  );

  // Get redemptions by item
  api.route(
    "GET /admin/redemptions/item/{redeemableId}",
    {
      handler: "packages/functions/src/redemption/getByItem.main",
      name: `${$app.name}-${$app.stage}-GetRedemptionsByItem`,
      link: [storage.tables.redemptionHistory, storage.tables.user],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  );

  // ======================
  // Points Transaction Routes (Admin)
  // ======================

  // Get all points transactions
  api.route(
    "GET /admin/points/transactions",
    {
      handler: "packages/functions/src/adminPoints/getTransactions.main",
      name: `${$app.name}-${$app.stage}-GetTransactions`,
      link: [storage.tables.pointsTransaction, storage.tables.user],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  );

  // Manual points adjustment (admin can add/remove points)
  api.route(
    "POST /admin/points/adjust",
    {
      handler: "packages/functions/src/adminPoints/adjustPoints.main",
      name: `${$app.name}-${$app.stage}-AdjustPoints`,
      link: [storage.tables.pointsTransaction, storage.tables.user],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  );

  // ======================
  // Public/User Routes for Points
  // ======================

  // Get available redeemable items (for customers)
  api.route("GET /redeemables/{branchId}", {
    handler: "packages/functions/src/points/getAvailable.main",
    name: `${$app.name}-${$app.stage}-ListRedeemables`,
    link: [storage.tables.redeemableItem],
    ...defaultFunctionProps,
  });

  // Get user's points balance and history
  api.route(
    "GET /points/balance",
    {
      handler: "packages/functions/src/points/getBalance.main",
      name: `${$app.name}-${$app.stage}-GetPointsBalance`,
      link: [
        storage.tables.user,
        storage.tables.pointsTransaction,
        storage.tables.redemptionHistory,
      ],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  );

  // Get user's redemptions (for checkout)
  api.route(
    "GET /points/my-redemptions",
    {
      handler: "packages/functions/src/points/getMyRedemptions.main",
      name: `${$app.name}-${$app.stage}-GetMyRedemptions`,
      link: [storage.tables.redemptionHistory],
      ...defaultFunctionProps,
      environment: authEnvironment,
    },
    protectedRouteConfig
  );

  // ✅ FIXED: Redeem points for item - Added pointsConfig to link array
  api.route(
    "POST /points/redeem",
    {
      handler: "packages/functions/src/points/redeem.main",
      name: `${$app.name}-${$app.stage}-RedeemPoints`,
      link: [
        storage.tables.user,
        storage.tables.redeemableItem,
        storage.tables.redemptionHistory,
        storage.tables.pointsTransaction,
        storage.tables.pointsConfig, // ✅ ADDED THIS LINE
      ],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  );

  api.route(
    "POST /redemptions/update-status",
    {
      handler: "packages/functions/src/redemption/updateRedemptionStatus.main",
      name: `${$app.name}-${$app.stage}-UpdateRedempStatus`,
      link: [storage.tables.redemptionHistory],
      ...defaultFunctionProps,
    },
    protectedRouteConfig
  );

  return {
    api,
  };

//   // ======================
//   // Redeemable Items Routes (Admin)
//   // ======================

//   // Get all redeemable items (with filters)
//   api.route(
//     "GET /admin/redeemables",
//     {
//       handler: "packages/functions/src/adminRedeemable/getAll.main",
//       name: `${$app.name}-${$app.stage}-GetAllRedeemableItems`,
//       link: [storage.tables.redeemableItem],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Get single redeemable item
//   api.route(
//     "GET /admin/redeemables/{id}",  // ======================
//   // Redeemable Items Routes (Admin)
//   // ======================

//   // Get all redeemable items (with filters)
//   api.route(
//     "GET /admin/redeemables",
//     {
//       handler: "packages/functions/src/adminRedeemable/getAll.main",
//       name: `${$app.name}-${$app.stage}-GetAllRedeemableItems`,
//       link: [storage.tables.redeemableItem],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Get single redeemable item
//   api.route(
//     "GET /admin/redeemables/{id}",
//     {
//       handler: "packages/functions/src/adminRedeemable/getById.main",
//       name: `${$app.name}-${$app.stage}-GetRedeemableItemById`,
//       link: [storage.tables.redeemableItem],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Create redeemable item
//   api.route(
//     "POST /admin/redeemables",
//     {  // ======================
//   // Redeemable Items Routes (Admin)
//   // ======================

//   // Get all redeemable items (with filters)
//   api.route(
//     "GET /admin/redeemables",
//     {
//       handler: "packages/functions/src/adminRedeemable/getAll.main",
//       name: `${$app.name}-${$app.stage}-GetAllRedeemableItems`,
//       link: [storage.tables.redeemableItem],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Get single redeemable item
//   api.route(
//     "GET /admin/redeemables/{id}",
//     {
//       handler: "packages/functions/src/adminRedeemable/getById.main",
//       name: `${$app.name}-${$app.stage}-GetRedeemableItemById`,
//       link: [storage.tables.redeemableItem],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Create redeemable item
//   api.route(
//     "POST /admin/redeemables",
//     {
//       handler: "packages/functions/src/adminRedeemable/create.main",
//       name: `${$app.name}-${$app.stage}-CreateRedeemableItem`,
//       link: [storage.tables.redeemableItem, storage.tables.branch],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Update redeemable item
//   api.route(
//     "PUT /admin/redeemables/{id}",
//     {
//       handler: "packages/functions/src/adminRedeemable/update.main",
//       name: `${$app.name}-${$app.stage}-UpdateRedeemableItem`,
//       link: [storage.tables.redeemableItem, storage.tables.branch],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Delete redeemable item
//   api.route(
//     "DELETE /admin/redeemables/{id}",
//     {
//       handler: "packages/functions/src/adminRedeemable/delete.main",
//       name: `${$app.name}-${$app.stage}-DeleteRedeemableItem`,
//       link: [storage.tables.redeemableItem],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // ======================
//   // Redemption Analytics Routes (Admin)
//   // ======================

//   // Get redemption statistics
//   api.route(
//     "GET /admin/redemptions/stats",
//     {
//       handler: "packages/functions/src/redemption/getStats.main",
//       name: `${$app.name}-${$app.stage}-GetRedemptionStats`,
//       link: [storage.tables.redemptionHistory, storage.tables.redeemableItem],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Get all redemptions with filters
//   api.route(
//     "GET /admin/redemptions",
//     {
//       handler: "packages/functions/src/redemption/getAll.main",
//       name: `${$app.name}-${$app.stage}-GetAllRedemptions`,
//       link: [
//         storage.tables.redemptionHistory,
//         storage.tables.user,
//         storage.tables.redeemableItem,
//       ],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Get redemptions by item
//   api.route(
//     "GET /admin/redemptions/item/{redeemableId}",
//     {
//       handler: "packages/functions/src/redemption/getByItem.main",
//       name: `${$app.name}-${$app.stage}-GetRedemptionsByItem`,
//       link: [storage.tables.redemptionHistory, storage.tables.user],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // ======================
//   // Points Transaction Routes (Admin)
//   // ======================

//   // Get all points transactions
//   api.route(
//     "GET /admin/points/transactions",
//     {
//       handler: "packages/functions/src/adminPoints/getTransactions.main",
//       name: `${$app.name}-${$app.stage}-GetTransactions`,
//       link: [storage.tables.pointsTransaction, storage.tables.user],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Manual points adjustment (admin can add/remove points)
//   api.route(
//     "POST /admin/points/adjust",
//     {
//       handler: "packages/functions/src/adminPoints/adjustPoints.main",
//       name: `${$app.name}-${$app.stage}-AdjustPoints`,
//       link: [storage.tables.pointsTransaction, storage.tables.user],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // ======================
//   // Public/User Routes for Points
//   // ======================

//   // Get available redeemable items (for customers)
//   api.route("GET /redeemables/{branchId}", {
//     handler: "packages/functions/src/points/getAvailable.main",
//     name: `${$app.name}-${$app.stage}-ListRedeemables`,
//     link: [storage.tables.redeemableItem],
//     ...defaultFunctionProps,
//   });

//   // Get user's points balance and history
//   api.route(
//     "GET /points/balance",
//     {
//       handler: "packages/functions/src/points/getBalance.main",
//       name: `${$app.name}-${$app.stage}-GetPointsBalance`,
//       link: [
//         storage.tables.user,
//         storage.tables.pointsTransaction,
//         storage.tables.redemptionHistory,
//       ],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Get user's redemptions (for checkout)
//   api.route(
//     "GET /points/my-redemptions",
//     {
//       handler: "packages/functions/src/points/getMyRedemptions.main",
//       name: `${$app.name}-${$app.stage}-GetMyRedemptions`,
//       link: [storage.tables.redemptionHistory],
//       ...defaultFunctionProps,
//       environment: authEnvironment,
//     },
//     protectedRouteConfig
//   );

//   // Redeem points for item
//   api.route(
//     "POST /points/redeem",
//     {
//       handler: "packages/functions/src/points/redeem.main",
//       name: `${$app.name}-${$app.stage}-RedeemPoints`,
//       link: [
//         storage.tables.user,
//         storage.tables.redeemableItem,
//         storage.tables.redemptionHistory,
//         storage.tables.pointsTransaction,
//       ],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   api.route(
//     "POST /redemptions/update-status",
//     {
//       handler: "packages/functions/src/redemption/updateRedemptionStatus.main",
//       name: `${$app.name}-${$app.stage}-UpdateRedempStatus`,
//       link: [storage.tables.redemptionHistory],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   return {
//     api,
//   };
// }

//       handler: "packages/functions/src/adminRedeemable/create.main",
//       name: `${$app.name}-${$app.stage}-CreateRedeemableItem`,
//       link: [storage.tables.redeemableItem, storage.tables.branch],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Update redeemable item
//   api.route(
//     "PUT /admin/redeemables/{id}",
//     {
//       handler: "packages/functions/src/adminRedeemable/update.main",
//       name: `${$app.name}-${$app.stage}-UpdateRedeemableItem`,
//       link: [storage.tables.redeemableItem, storage.tables.branch],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Delete redeemable item
//   api.route(
//     "DELETE /admin/redeemables/{id}",
//     {
//       handler: "packages/functions/src/adminRedeemable/delete.main",
//       name: `${$app.name}-${$app.stage}-DeleteRedeemableItem`,
//       link: [storage.tables.redeemableItem],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // ======================
//   // Redemption Analytics Routes (Admin)
//   // ======================

//   // Get redemption statistics
//   api.route(
//     "GET /admin/redemptions/stats",
//     {
//       handler: "packages/functions/src/redemption/getStats.main",
//       name: `${$app.name}-${$app.stage}-GetRedemptionStats`,
//       link: [storage.tables.redemptionHistory, storage.tables.redeemableItem],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Get all redemptions with filters
//   api.route(
//     "GET /admin/redemptions",
//     {
//       handler: "packages/functions/src/redemption/getAll.main",
//       name: `${$app.name}-${$app.stage}-GetAllRedemptions`,
//       link: [
//         storage.tables.redemptionHistory,
//         storage.tables.user,
//         storage.tables.redeemableItem,
//       ],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Get redemptions by item
//   api.route(
//     "GET /admin/redemptions/item/{redeemableId}",
//     {
//       handler: "packages/functions/src/redemption/getByItem.main",
//       name: `${$app.name}-${$app.stage}-GetRedemptionsByItem`,
//       link: [storage.tables.redemptionHistory, storage.tables.user],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // ======================
//   // Points Transaction Routes (Admin)
//   // ======================

//   // Get all points transactions
//   api.route(
//     "GET /admin/points/transactions",
//     {
//       handler: "packages/functions/src/adminPoints/getTransactions.main",
//       name: `${$app.name}-${$app.stage}-GetTransactions`,
//       link: [storage.tables.pointsTransaction, storage.tables.user],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Manual points adjustment (admin can add/remove points)
//   api.route(
//     "POST /admin/points/adjust",
//     {
//       handler: "packages/functions/src/adminPoints/adjustPoints.main",
//       name: `${$app.name}-${$app.stage}-AdjustPoints`,
//       link: [storage.tables.pointsTransaction, storage.tables.user],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // ======================
//   // Public/User Routes for Points
//   // ======================

//   // Get available redeemable items (for customers)
//   api.route("GET /redeemables/{branchId}", {
//     handler: "packages/functions/src/points/getAvailable.main",
//     name: `${$app.name}-${$app.stage}-ListRedeemables`,
//     link: [storage.tables.redeemableItem],
//     ...defaultFunctionProps,
//   });

//   // Get user's points balance and history
//   api.route(
//     "GET /points/balance",
//     {
//       handler: "packages/functions/src/points/getBalance.main",
//       name: `${$app.name}-${$app.stage}-GetPointsBalance`,
//       link: [
//         storage.tables.user,
//         storage.tables.pointsTransaction,
//         storage.tables.redemptionHistory,
//       ],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Get user's redemptions (for checkout)
//   api.route(
//     "GET /points/my-redemptions",
//     {
//       handler: "packages/functions/src/points/getMyRedemptions.main",
//       name: `${$app.name}-${$app.stage}-GetMyRedemptions`,
//       link: [storage.tables.redemptionHistory],
//       ...defaultFunctionProps,
//       environment: authEnvironment,
//     },
//     protectedRouteConfig
//   );

//   // Redeem points for item
//   api.route(
//     "POST /points/redeem",
//     {
//       handler: "packages/functions/src/points/redeem.main",
//       name: `${$app.name}-${$app.stage}-RedeemPoints`,
//       link: [
//         storage.tables.user,
//         storage.tables.redeemableItem,
//         storage.tables.redemptionHistory,
//         storage.tables.pointsTransaction,
//       ],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   api.route(
//     "POST /redemptions/update-status",
//     {
//       handler: "packages/functions/src/redemption/updateRedemptionStatus.main",
//       name: `${$app.name}-${$app.stage}-UpdateRedempStatus`,
//       link: [storage.tables.redemptionHistory],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   return {
//     api,
//   };
// }

//     {
//       handler: "packages/functions/src/adminRedeemable/getById.main",
//       name: `${$app.name}-${$app.stage}-GetRedeemableItemById`,
//       link: [storage.tables.redeemableItem],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Create redeemable item
//   api.route(
//     "POST /admin/redeemables",
//     {
//       handler: "packages/functions/src/adminRedeemable/create.main",
//       name: `${$app.name}-${$app.stage}-CreateRedeemableItem`,
//       link: [storage.tables.redeemableItem, storage.tables.branch],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Update redeemable item
//   api.route(
//     "PUT /admin/redeemables/{id}",
//     {
//       handler: "packages/functions/src/adminRedeemable/update.main",
//       name: `${$app.name}-${$app.stage}-UpdateRedeemableItem`,
//       link: [storage.tables.redeemableItem, storage.tables.branch],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Delete redeemable item
//   api.route(
//     "DELETE /admin/redeemables/{id}",
//     {
//       handler: "packages/functions/src/adminRedeemable/delete.main",
//       name: `${$app.name}-${$app.stage}-DeleteRedeemableItem`,
//       link: [storage.tables.redeemableItem],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // ======================
//   // Redemption Analytics Routes (Admin)
//   // ======================

//   // Get redemption statistics
//   api.route(
//     "GET /admin/redemptions/stats",
//     {
//       handler: "packages/functions/src/redemption/getStats.main",
//       name: `${$app.name}-${$app.stage}-GetRedemptionStats`,
//       link: [storage.tables.redemptionHistory, storage.tables.redeemableItem],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Get all redemptions with filters
//   api.route(
//     "GET /admin/redemptions",
//     {
//       handler: "packages/functions/src/redemption/getAll.main",
//       name: `${$app.name}-${$app.stage}-GetAllRedemptions`,
//       link: [
//         storage.tables.redemptionHistory,
//         storage.tables.user,
//         storage.tables.redeemableItem,
//       ],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Get redemptions by item
//   api.route(
//     "GET /admin/redemptions/item/{redeemableId}",
//     {
//       handler: "packages/functions/src/redemption/getByItem.main",
//       name: `${$app.name}-${$app.stage}-GetRedemptionsByItem`,
//       link: [storage.tables.redemptionHistory, storage.tables.user],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // ======================
//   // Points Transaction Routes (Admin)
//   // ======================

//   // Get all points transactions
//   api.route(
//     "GET /admin/points/transactions",
//     {
//       handler: "packages/functions/src/adminPoints/getTransactions.main",
//       name: `${$app.name}-${$app.stage}-GetTransactions`,
//       link: [storage.tables.pointsTransaction, storage.tables.user],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Manual points adjustment (admin can add/remove points)
//   api.route(
//     "POST /admin/points/adjust",
//     {
//       handler: "packages/functions/src/adminPoints/adjustPoints.main",
//       name: `${$app.name}-${$app.stage}-AdjustPoints`,
//       link: [storage.tables.pointsTransaction, storage.tables.user],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // ======================
//   // Public/User Routes for Points
//   // ======================

//   // Get available redeemable items (for customers)
//   api.route("GET /redeemables/{branchId}", {
//     handler: "packages/functions/src/points/getAvailable.main",
//     name: `${$app.name}-${$app.stage}-ListRedeemables`,
//     link: [storage.tables.redeemableItem],
//     ...defaultFunctionProps,
//   });

//   // Get user's points balance and history
//   api.route(
//     "GET /points/balance",
//     {
//       handler: "packages/functions/src/points/getBalance.main",
//       name: `${$app.name}-${$app.stage}-GetPointsBalance`,
//       link: [
//         storage.tables.user,
//         storage.tables.pointsTransaction,
//         storage.tables.redemptionHistory,
//       ],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   // Get user's redemptions (for checkout)
//   api.route(
//     "GET /points/my-redemptions",
//     {
//       handler: "packages/functions/src/points/getMyRedemptions.main",
//       name: `${$app.name}-${$app.stage}-GetMyRedemptions`,
//       link: [storage.tables.redemptionHistory],
//       ...defaultFunctionProps,
//       environment: authEnvironment,
//     },
//     protectedRouteConfig
//   );

//   // Redeem points for item
//   api.route(
//     "POST /points/redeem",
//     {
//       handler: "packages/functions/src/points/redeem.main",
//       name: `${$app.name}-${$app.stage}-RedeemPoints`,
//       link: [
//         storage.tables.user,
//         storage.tables.redeemableItem,
//         storage.tables.redemptionHistory,
//         storage.tables.pointsTransaction,
//       ],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   api.route(
//     "POST /redemptions/update-status",
//     {
//       handler: "packages/functions/src/redemption/updateRedemptionStatus.main",
//       name: `${$app.name}-${$app.stage}-UpdateRedempStatus`,
//       link: [storage.tables.redemptionHistory],
//       ...defaultFunctionProps,
//     },
//     protectedRouteConfig
//   );

//   return {
//     api,
//   };
}
