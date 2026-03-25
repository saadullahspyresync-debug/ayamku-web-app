// import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
// import { DynamoDBDocumentClient, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
// import { Resource } from "sst";

// const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// export const main = async (event: any) => {
//   const userIdToDelete = event.pathParameters.id;

//   try {
//     // 1. Find the item first to get its PK and SK
//     const findResult = await dynamoDb.send(
//       new QueryCommand({
//         TableName: Resource.BranchManager.name,
//         IndexName: "userIndex",
//         KeyConditionExpression: "userId = :uid",
//         ExpressionAttributeValues: { ":uid": userIdToDelete },
//       })
//     );

//     const manager = findResult.Items?.[0];

//     if (!manager) {
//       return {
//         statusCode: 404,
//         body: JSON.stringify({ message: "Branch Manager not found" }),
//       };
//     }

//     // 2. Delete using the PK and SK found
//     await dynamoDb.send(
//       new DeleteCommand({
//         TableName: Resource.BranchManager.name,
//         Key: {
//           PK: manager.PK,
//           SK: manager.SK,
//         },
//       })
//     );

//     return {
//       statusCode: 200,
//       body: JSON.stringify({ message: "Branch Manager deleted successfully" }),
//     };
//   } catch (err) {
//     console.error("Delete Error:", err);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ error: "Failed to delete manager" }),
//     };
//   }
// };



import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cognito = new CognitoIdentityProviderClient({});

export const main = async (event: any) => {
  const userIdToDelete = event.pathParameters.id;

  try {
    // 1. Fetch the record to ensure it exists and get keys
    const findResult = await dynamoDb.send(
      new QueryCommand({
        TableName: Resource.BranchManager.name,
        IndexName: "userIndex",
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": userIdToDelete },
      })
    );

    const manager = findResult.Items?.[0];

    if (!manager) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Branch Manager not found" }),
      };
    }

    // 2. Delete from Cognito first
    // It's usually safer to delete the identity first. If this fails, 
    // the DB record remains as a "source of truth" to retry.
    await cognito.send(
      new AdminDeleteUserCommand({
        UserPoolId: Resource.UserPool.id, // Ensure your SST resource name matches
        Username: userIdToDelete, // Usually the 'sub' or 'username'
      })
    );

    // 3. Delete from DynamoDB
    await dynamoDb.send(
      new DeleteCommand({
        TableName: Resource.BranchManager.name,
        Key: {
          PK: manager.PK,
          SK: manager.SK,
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Manager removed from Cognito and DynamoDB" }),
    };
  } catch (err: any) {
    console.error("Delete Error:", err);
    
    // Handle the case where the user might already be gone from Cognito
    if (err.name === "UserNotFoundException") {
       // Logic to decide if you want to proceed with DB deletion anyway
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to complete deletion process" }),
    };
  }
};