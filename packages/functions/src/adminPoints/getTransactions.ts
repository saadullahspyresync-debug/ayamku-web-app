// packages/functions/src/admin/points/getTransactions.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));


export const main = async (event: any) => {
  try {
    const userId = event.queryStringParameters?.userId;
    const type = event.queryStringParameters?.type;

    let command;
    if (userId) {
      command = new QueryCommand({
        TableName: Resource.PointsTransaction.name,
        IndexName: "userIndex",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
        ScanIndexForward: false, // Sort by createdAt descending
      });
    } else if (type) {
      command = new QueryCommand({
        TableName: Resource.PointsTransaction.name,
        IndexName: "typeIndex",
        KeyConditionExpression: "#type = :type",
        ExpressionAttributeNames: {
          "#type": "type",
        },
        ExpressionAttributeValues: {
          ":type": type,
        },
        ScanIndexForward: false,
      });
    } else {
      command = new ScanCommand({
        TableName: Resource.PointsTransaction.name,
        Limit: 100, // Limit to last 100 transactions
      });
    }

    const result = await dynamoDb.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: result.Items || [],
      }),
    };
  } catch (error) {
    console.error("Get transactions error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to fetch points transactions",
      }),
    };
  }
};