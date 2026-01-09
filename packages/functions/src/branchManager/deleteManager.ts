import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const main = async (event: any) => {
  const userIdToDelete = event.pathParameters.id;

  try {
    // 1. Find the item first to get its PK and SK
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

    // 2. Delete using the PK and SK found
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
      body: JSON.stringify({ message: "Branch Manager deleted successfully" }),
    };
  } catch (err) {
    console.error("Delete Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to delete manager" }),
    };
  }
};