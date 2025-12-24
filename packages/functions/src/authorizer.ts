// import { CognitoJwtVerifier } from "aws-jwt-verify";
// import { Resource } from "sst";
// import { unmarshall } from "@aws-sdk/util-dynamodb";
// import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
// import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// const verifier = CognitoJwtVerifier.create({
//   userPoolId: Resource.UserPool.id!,
//   clientId: Resource.UserPoolClient.id!,
//   tokenUse: "access",
// });

// // Define role-based permissions
// const rolePermissions = {
//   [Resource.UserGroups.Admin]: [
//     { path: "/branch", methods: ["GET", "POST"] },
//     { path: "/branch/{id}", methods: ["GET", "PUT", "DELETE", "PATCH"] },
//     { path: "/category", methods: ["GET", "POST"] },
//     { path: "/category/{id}", methods: ["GET", "PUT", "DELETE", "PATCH"] },
//     { path: "/items", methods: ["GET", "POST"] },
//     { path: "/items/{id}", methods: ["GET", "PUT", "DELETE", "PATCH"] },
//     { path: "/upload", methods: ["POST"] },
//     { path: "/deals", methods: ["GET", "POST"] },
//     { path: "/deals/{id}", methods: ["GET", "PUT", "DELETE", "PATCH"] },
//     { path: "/promotions", methods: ["GET", "POST"] },
//     { path: "/promotions/{id}", methods: ["GET", "PUT", "DELETE", "PATCH"] },
//     { path: "/highlights", methods: ["GET", "POST"] },
//     { path: "/highlights/{id}", methods: ["GET", "PUT", "DELETE", "PATCH"] },
//     { path: "/sliders", methods: ["GET", "POST"] },
//     { path: "/sliders/{id}", methods: ["GET", "PUT", "DELETE", "PATCH"] },

//     // ===== Points Configuration (Admin) =====
//     { path: "/admin/points/config", methods: ["GET", "PUT"] },

//     // ===== Redeemable Items (Admin) =====
//     { path: "/admin/redeemables", methods: ["GET", "POST"] },
//     { path: "/admin/redeemables/{id}", methods: ["GET", "PUT", "DELETE"] },

//     // ===== Redemption Analytics (Admin) =====
//     { path: "/admin/redemptions/stats", methods: ["GET"] },
//     { path: "/admin/redemptions", methods: ["GET"] },
//     { path: "/admin/redemptions/item/{redeemableId}", methods: ["GET"] },

//     // ===== Points Transactions (Admin) =====
//     { path: "/admin/points/transactions", methods: ["GET"] },
//     { path: "/admin/points/adjust", methods: ["POST"] },

//   ],
//   [Resource.UserGroups.Customer]: [
//     { path: "/points/balance", methods: ["GET"] },
//     { path: "/points/redeem", methods: ["POST"] },
//   ]
// };
//  async function getUserFromDB(userId: string) {
//   const params = {
//     TableName: Resource.User.name,
//     Key: {
//       userId: { S: userId }, // ✅ matches your table's hash key
//     },
//   };

//   try {
//     const { Item } = await dynamoDb.send(new GetItemCommand(params));
//     return Item ? unmarshall(Item) : null;
//   } catch (error) {
//     console.error("Error fetching user from DynamoDB:", error);
//     throw new Error("Internal server error");
//   }
// }

// /**
//  * Main function to handle authorization in AWS Lambda.
//  *
//  * This function verifies the JWT token from the request's authorization header,
//  * checks the user's role-based permissions, and ensures the user is active and
//  * authorized to access the requested route. If authorization is successful,
//  * it returns a response indicating access is granted. If not, it returns a
//  * 403 error with the appropriate error message.
//  *
//  * @param event - The event object containing HTTP request details.
//  * @returns A promise resolving to an object indicating authorization status
//  *          and context or an error response.
//  */
// export const main = async (event: any): Promise<any> => {
//   try {
// console.log('AUTHORIZOR ACCESSES', { event });

//     // logger.info('AUTHORIZOR ACCESSES', { event })
//     const authHeader =
//       event.headers?.authorization || event.headers?.Authorization;
//     if (!authHeader) throw new Error("No Auth header");

//     const token = authHeader.replace("Bearer ", "");
//     if (!token) throw new Error("No token provided");

//     let payload;
//     let retries = 0;
//     const maxRetries = 3;

//     while (retries < maxRetries) {
//       try {
//         payload = await verifier.verify(token);
//         break; // Success, exit the retry loop
//       } catch (err) {
//         if (
//           err instanceof Error &&
//           err.message &&
//           err.message.includes("time-out") &&
//           retries < maxRetries - 1
//         ) {
//           // Only retry on timeout errors
//           retries++;

//           // Exponential backoff: wait longer with each retry
//           await new Promise((resolve) =>
//             setTimeout(resolve, 500 * Math.pow(2, retries))
//           );
//         } else {
//           throw err;
//         }
//       }
//     }

//     if (!payload) throw new Error("Invalid token");

//     const userRole = (payload["cognito:groups"] || [])[0] || "Guest";
//     console.log('AUTHORIZOR ACCESSES', { userRole });

//     const userIdFromToken = payload["sub"];
//     if (!rolePermissions[userRole]) {
//       throw new Error("Access denied: No permissions assigned to your role");
//     }

//     // Fetch user from DynamoDB
//     const userFromDB = await getUserFromDB(userIdFromToken);
//     if (!userFromDB) {
//       throw new Error("User not found in the database");
//     }

//     // **Check if user is active**
//     if (userFromDB.status !== undefined && userFromDB.status !== "active") {
//       throw new Error("user_status_false");
//     }

//     const requestedRoute = event.requestContext.http.path;
//     const httpMethod = event.requestContext.http.method;
//     const userId = payload["sub"]; // Unique user identifier

//     // Convert dynamic segments in the permission path to a regex pattern
//     const pathToRegex = (path: string): RegExp => {
//       const regexString = path
//         .replace(/\//g, "\\/") // Escape forward slashes
//         .replace(/\{[^}]+\}/g, "[^\\/]+"); // Replace {variable} with a regex to match any segment
//       return new RegExp(`^${regexString}$`);
//     };

//     // Match requested route with permission paths
//     const matchRoute = (route: string, permissionPath: string): boolean => {
//       const regex = pathToRegex(permissionPath);
//       return regex.test(route);
//     };

//     // Check if the user has permission for the requested route and method
//     const hasPermission = rolePermissions[
//       userRole as keyof typeof rolePermissions
//     ]?.some(
//       (permission) =>
//         matchRoute(requestedRoute, permission.path) &&
//         permission.methods.includes(httpMethod)
//     );

//     if (!hasPermission) {
//       throw new Error(
//         "Access denied: You do not have permission to access this resource"
//       );
//     }

//     // Ensure restricted roles can only access their own data
//     if (requestedRoute.includes("/s/")) {
//       let routeUserId = String(requestedRoute.split("/s/")[1].split("/")[0]);
//       routeUserId = routeUserId.replace("EMPLOYEE#", ""); // Remove prefix for consistency
//       const allowedRoles = userRole !== Resource.UserGroups.Admin;

//       if (routeUserId !== userId && !allowedRoles) {
//         throw new Error("Access denied: User can only access their own data");
//       }
//     }

//     return { isAuthorized: true, context: { userRole, userId } };
//   } catch (error) {
//     let origin;
//     if (Resource.App.stage === "staging") {
//       origin = `https://staging.infenet.net`;
//     } else if (Resource.App.stage === "production") {
//       origin = `https://infenet.net`;
//     } else if (Resource.App.stage === "development") {
//       origin = `https://dev.infenet.net`;
//     } else {
//       origin = `http://localhost:3000`; // Adjust the port if needed
//     }

//     // Improved error handling
//     const errorMessage =
//       error instanceof Error ? error.message : "An unknown error occurred";

//     return {
//       statusCode: 403, // Use 401 for authentication failure, 403 for authorization failure
//       body: JSON.stringify({
//         message: "Access denied",
//         error: errorMessage,
//       }),
//       isAuthorized: false,
//       headers: {
//         "Access-Control-Allow-Origin": origin,
//         "Access-Control-Allow-Methods":
//           "OPTIONS, GET, POST, PUT, DELETE, PATCH",
//         "Access-Control-Allow-Headers": "Content-Type, Authorization",
//       },
//     };
//   }
// };


import { CognitoJwtVerifier } from "aws-jwt-verify";
import { Resource } from "sst";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// const userPoolId = process.env.COGNITO_USER_POOL_ID!;
// const clientId = process.env.COGNITO_USER_POOL_CLIENT_ID!;

const verifier = CognitoJwtVerifier.create({
  userPoolId: Resource.UserPool.id,
  clientId: Resource.UserPoolClient.id,
  tokenUse: "access",
});

console.log("Verifier:", verifier);

// Define role-based permissions
const rolePermissions = {
  [Resource.UserGroups.Admin]: [
    { path: "/branch", methods: ["GET", "POST"] },
    { path: "/branch/{id}", methods: ["GET", "PUT", "DELETE", "PATCH"] },
    { path: "/category", methods: ["GET", "POST"] },
    { path: "/category/{id}", methods: ["GET", "PUT", "DELETE", "PATCH"] },
    { path: "/items", methods: ["GET", "POST"] },
    { path: "/items/{id}", methods: ["GET", "PUT", "DELETE", "PATCH"] },
    { path: "/upload", methods: ["POST"] },
    { path: "/deals", methods: ["GET", "POST"] },
    { path: "/deals/{id}", methods: ["GET", "PUT", "DELETE", "PATCH"] },
    { path: "/promotions", methods: ["GET", "POST"] },
    { path: "/promotions/{id}", methods: ["GET", "PUT", "DELETE", "PATCH"] },
    { path: "/highlights", methods: ["GET", "POST"] },
    { path: "/highlights/{id}", methods: ["GET", "PUT", "DELETE", "PATCH"] },
    { path: "/sliders", methods: ["GET", "POST"] },
    { path: "/sliders/{id}", methods: ["GET", "PUT", "DELETE", "PATCH"] },

    // Order Management
    { path: "/admin/orders", methods: ["GET"] },
    { path: "/admin/orders-stats", methods: ["GET"] },
    { path: "/admin/orders/{id}", methods: ["GET", "PUT", "DELETE"] },
    { path: "/admin/orders/{id}/status", methods: ["PATCH" ] },


    // ===== Points Configuration (Admin) =====
    { path: "/admin/points/config", methods: ["GET", "PUT"] },

    // ===== Redeemable Items (Admin) =====
    { path: "/admin/redeemables", methods: ["GET", "POST"] },
    { path: "/admin/redeemables/{id}", methods: ["GET", "PUT", "DELETE"] },

    // ===== Redemption Analytics (Admin) =====
    { path: "/admin/redemptions/stats", methods: ["GET"] },
    { path: "/admin/redemptions", methods: ["GET"] },
    { path: "/admin/redemptions/item/{redeemableId}", methods: ["GET"] },

    // ===== Points Transactions (Admin) =====
    { path: "/admin/points/transactions", methods: ["GET"] },
    { path: "/admin/points/adjust", methods: ["POST"] },
  ],
  [Resource.UserGroups.Customer]: [
    { path: "/admin/points/config", methods: ["GET"] },
    { path: "/points/balance", methods: ["GET"] },
    { path: "/points/redeem", methods: ["POST"] },
    { path: "/orders", methods: ["GET"] },
    { path: "/orders/{id}", methods: ["GET"] },
    { path: "/orders", methods: ["POST"] },
    { path: "/points/my-redemptions", methods: ["GET"] },
    { path: "/redemptions/update-status", methods: ["POST"] },
    { path: "/secure-acceptance", methods: ["POST"] },
    { path: "/payment-success", methods: ["GET"] },
  ],
};

async function getUserFromDB(userId: string) {
  console.log("🔹 Fetching user from DynamoDB:", userId);

  const params = {
    TableName: Resource.User.name,
    Key: { userId: { S: userId } },
  };
  try {
    const { Item } = await dynamoDb.send(new GetItemCommand(params));
    const user = Item ? unmarshall(Item) : null;
    return user;
  } catch (error) {
    console.error("❌ Error fetching user from DynamoDB:", error);
    throw new Error("Internal server error");
  }
}

export const main = async (event: any): Promise<any> => {
  console.log("🚀 AUTHORIZER INVOKED");

  try {
    const authHeader =
      event.headers?.authorization || event.headers?.Authorization;
    if (!authHeader) throw new Error("No Auth header");
    console.log("🔹 Auth Header found");

    const token = authHeader.replace("Bearer ", "");
    if (!token) throw new Error("No token provided");
    console.log("🔹 Token extracted");

    let payload;
    let retries = 0;
    const maxRetries = 3;

    console.log("🔹 Verifying token...",token);

    while (retries < maxRetries) {
      try {
        payload = await verifier.verify(token);
        console.log("✅ Token verified successfully");
        break;
      } catch (err) {
        console.error(`⚠️ JWT verify attempt ${retries + 1} failed:`, err);
        if (
          err instanceof Error &&
          err.message.includes("time-out") &&
          retries < maxRetries - 1
        ) {
          retries++;
          await new Promise((resolve) =>
            setTimeout(resolve, 500 * Math.pow(2, retries))
          );
        } else {
          throw err;
        }
      }
    }

    if (!payload) throw new Error("Invalid token");

    const userRole = (payload["cognito:groups"] || [])[0] || "Guest";
    const userIdFromToken = payload["sub"];
    console.log("👤 User role:", userRole);

    if (!rolePermissions[userRole]) {
      console.error("🚫 No permissions assigned to role:", userRole);
      throw new Error("Access denied: No permissions assigned to your role");
    }

    // Fetch user from DB
    if(userRole != 'Admin'){
      const userFromDB = await getUserFromDB(userIdFromToken);
      if (!userFromDB) {
        console.error("🚫 User not found in DB:", userIdFromToken);
        throw new Error("User not found in the database");
      }

      if (userFromDB.status !== undefined && userFromDB.status !== "active") {
        console.error("🚫 Inactive user:", userFromDB.status);
        throw new Error("user_status_false");
      }
  }

    const requestedRoute = event.requestContext.http.path;
    const httpMethod = event.requestContext.http.method;
    console.log("🌐 Requested Route:", requestedRoute);
    console.log("🔸 HTTP Method:", httpMethod);

    const pathToRegex = (path: string): RegExp => {
      const regexString = path
        .replace(/\//g, "\\/")
        .replace(/\{[^}]+\}/g, "[^\\/]+");
      return new RegExp(`^${regexString}$`, "i"); // case-insensitive
    };

    const matchRoute = (route: string, permissionPath: string): boolean => {
      const regex = pathToRegex(permissionPath);
      const result = regex.test(route);
      // if (result) {
      //   console.log(`✅ Route matched: ${route} ↔ ${permissionPath}`);
      // }
      return result;
    };

    const hasPermission = rolePermissions[
      userRole as keyof typeof rolePermissions
    ]?.some(
      (permission) =>
        matchRoute(requestedRoute, permission.path) &&
        permission.methods.includes(httpMethod)
    );

    if (!hasPermission) {
      console.error("🚫 No permission for route:", requestedRoute);
      throw new Error(
        "Access denied: You do not have permission to access this resource"
      );
    }

    return {
      isAuthorized: true,
      context: { userRole, userId: userIdFromToken },
    };
  } catch (error) {
    // console.error("❌ AUTHORIZER ERROR:", error);

    let origin;
    if (Resource.App.stage === "staging")
      origin = `https://staging.infenet.net`;
    else if (Resource.App.stage === "production")
      origin = `https://infenet.net`;
    else if (Resource.App.stage === "development")
      origin = `https://dev.infenet.net`;
    else origin = `http://localhost:3000`;

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    console.error("❌ Authorization failed:", { errorMessage });

    return {
      statusCode: 403,
      body: JSON.stringify({
        message: "Access denied",
        error: errorMessage,
      }),
      isAuthorized: false,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods":
          "OPTIONS, GET, POST, PUT, DELETE, PATCH",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    };
  }
};
