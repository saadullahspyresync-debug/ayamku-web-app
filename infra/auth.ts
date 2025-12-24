import * as pulumi from "@pulumi/pulumi"; // <--- 1. Import the Pulumi SDK


export const userGroups = new sst.Linkable("UserGroups", {
  properties: {
    Admin: "Admin",
    Customer: "Customer",
  },
});

export const userPool = new sst.aws.CognitoUserPool("UserPool", {
  usernames: ["email"],
  // triggers: {
  //   postConfirmation: {
  //     permissions: [
  //       {
  //         actions: ["*"],
  //         resources: ["*"],
  //       },
  //     ],
  //     handler: "packages/functions/src/postConfirmation.main",
  //   },
  // },login
  triggers: {
    postConfirmation: {
      handler: "packages/functions/src/postConfirmation.main",
      permissions: [
        {
          actions: ["cognito-idp:AdminAddUserToGroup"],
          resources: ["*"],
        },
      ],
    },
  },
  // ✅ Use the correct 'userPool' key within transform
  transform: {
    userPool: (args) => {
      // 2. Safely combine existing schemas with your new custom attribute
      const existingSchemas = args.schemas || [];
      args.schemas = pulumi.all([existingSchemas]).apply(([schemas]) => [
        ...(schemas || []), // Now you can safely spread the resolved array
        {
          name: "role",
          attributeDataType: "String",
          mutable: true,
          developerOnlyAttribute: false,
          required: false,
        },
      ]);
    },
  },
});

// ✅ Create user groups dynamically

console.log(userPool,'User pool......');

Object.keys(userGroups.properties).forEach((role) => {  
  new aws.cognito.UserGroup(`${role}Group`, {
    userPoolId: userPool.id,
    name: role,
    description: `${role} group with specific access`,
  });
});

// ✅ Define a user pool client with OAuth + secure auth flows
export const userPoolClient = userPool.addClient("UserPoolClient", {
  // You can add basic SST-level config here (like callback URLs, etc.)
  // e.g. callbackUrls: ["http://localhost:3000"],

  transform: {
    // ✅ Correct Pulumi-level override syntax
    client: {
      // These properties are passed through to the underlying AWS resource
      explicitAuthFlows: [
        "ALLOW_USER_PASSWORD_AUTH",
        "ALLOW_REFRESH_TOKEN_AUTH",
        "ALLOW_USER_SRP_AUTH",
      ],
      preventUserExistenceErrors: "ENABLED",
      supportedIdentityProviders: ["COGNITO"],
    },
  },
});
