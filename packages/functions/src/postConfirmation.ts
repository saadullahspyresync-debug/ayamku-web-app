// import {
//   CognitoIdentityProviderClient,
//   AdminAddUserToGroupCommand,
// } from "@aws-sdk/client-cognito-identity-provider";

// const cognitoClient = new CognitoIdentityProviderClient({
//   region: process.env.AWS_REGION || "us-east-1",
// });

// export async function main(event: any) {
//   try {

//     const { userPoolId, userName, request } = event;
//     const role = request?.userAttributes?.["custom:role"] || "Customer"; // default Customer

//     const groupName = role === "Admin" ? "Admin" : "Customer";

//     await cognitoClient.send(
//       new AdminAddUserToGroupCommand({
//         UserPoolId: userPoolId,
//         Username: userName,
//         GroupName: groupName,
//       })
//     );

//     console.log(`✅ Added ${userName} to group "${groupName}"`);
//     return event;
//   } catch (err) {
//     console.error("❌ Error adding user to group:", err);
//     return event; // don't block signup
//   }
// }
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION || "us-east-1";
const USERS_TABLE = process.env.USERS_TABLE || "Users";

const cognitoClient = new CognitoIdentityProviderClient({ region });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

export async function main(event: any) {
  try {
    const { userPoolId, userName, request } = event;
    const attrs = request?.userAttributes || {};

    const email = attrs.email;
    const role = attrs["custom:role"] || "Customer"; // Default role
    const firstName = attrs["given_name"] || "";
    const lastName = attrs["family_name"] || "";
    const groupName = role === "Admin" ? "Admin" : "Customer";

    // ✅ 1. Add user to Cognito group
    await cognitoClient.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: userName,
        GroupName: groupName,
      })
    );

    console.log(`✅ Added ${userName} to group "${groupName}"`);

    // ✅ 2. Check if user already exists in DynamoDB
    const existingUser = await dynamoClient.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId: userName },
      })
    );

    if (existingUser.Item) {
      console.log(`ℹ️ User already exists in DynamoDB: ${userName}`);
      return event; // skip creation
    }

    // ✅ 3. Create user record if not found
    const newUser = {
      userId: userName,
      email,
      firstName,
      lastName,
      role: groupName,
      points: 0,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    await dynamoClient.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: newUser,
      })
    );

    console.log(`✅ New user created in DynamoDB:`, newUser);

    return event;
  } catch (err) {
    console.error("❌ Error in post-signup trigger:", err);
    return event; // don't block signup
  }
}
