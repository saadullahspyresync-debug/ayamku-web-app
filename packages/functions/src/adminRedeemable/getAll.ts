// packages/functions/src/admin/redeemable/getAll.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));


export const main = async (event: any) => {
  try {
    const status = event.queryStringParameters?.status;
    const branchId = event.queryStringParameters?.branchId;

    let command;
    if (status) {
      command = new QueryCommand({
        TableName: Resource.RedeemableItem.name,
        IndexName: "statusIndex",
        KeyConditionExpression: "#status = :status",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": status,
        },
      });
    } else {
      command = new ScanCommand({
        TableName: Resource.RedeemableItem.name,
      });
    }

    const result = await dynamoDb.send(command);
    let items = result.Items || [];

    // Filter by branch if specified
    if (branchId && branchId !== "all") {
      items = items.filter((item) => item.branchId === branchId || item.branchId === "all");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: items,
      }),
    };
  } catch (error) {
    console.error("Get all redeemables error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to fetch redeemable items",
      }),
    };
  }
};