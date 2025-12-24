// import { api } from "./api";
import { userPool, userPoolClient } from "./auth";
import { bucket } from "./storage";
const region = aws.getRegionOutput().name;

export const identityPool = new sst.aws.CognitoIdentityPool("IdentityPool", {
  userPools: [
    {
      userPool: userPool.id,
      client: userPoolClient.id,
    },
  ],
  permissions: {
    authenticated: [
      {
        actions: ["s3:*"],
        resources: [
          // $concat(bucket.arn, "/private/${cognito-identity.amazonaws.com:sub}/*"),
          $concat(bucket.arn, "/public/*"), // All images go to the public folder
        ],
      },
      {
        actions: [
          "execute-api:*",
          "cognito-idp:AdminSetUserPassword", // Add this line
        ],
        resources: [
          $concat(
            "arn:aws:execute-api:",
            region,
            ":",
            aws.getCallerIdentityOutput({}).accountId,
            ":",
            // api.nodes.api.id,
            "/*/*/*"
          ),
        ],
      },
    ],
  },
});