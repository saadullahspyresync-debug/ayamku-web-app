// packages/functions/src/admin/redemption/getAll.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));


export const main = async (event: any) => {
  try {
    const status = event.queryStringParameters?.status;
    const redeemableId = event.queryStringParameters?.redeemableId;

    let command;
    if (status) {
      command = new QueryCommand({
        TableName: Resource.RedemptionHistory.name,
        IndexName: "statusIndex",
        KeyConditionExpression: "#status = :status",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": status,
        },
      });
    } else if (redeemableId) {
      command = new QueryCommand({
        TableName: Resource.RedemptionHistory.name,
        IndexName: "redeemableIndex",
        KeyConditionExpression: "redeemableId = :redeemableId",
        ExpressionAttributeValues: {
          ":redeemableId": redeemableId,
        },
      });
    } else {
      command = new ScanCommand({
        TableName: Resource.RedemptionHistory.name,
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
    console.error("Get all redemptions error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to fetch redemptions",
      }),
    };
  }
};