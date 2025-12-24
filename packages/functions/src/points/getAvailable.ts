// packages/functions/src/redeemable/getAvailable.ts - Public endpoint
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));


export const main = async (event: any) => {
  try {
    const branchId = event?.pathParameters?.branchId;
    // Get active redeemable items
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: Resource.RedeemableItem.name,
        IndexName: "statusIndex",
        KeyConditionExpression: "#status = :status",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": "active",
        },
      })
    );

    let items = result.Items || [];
    const now = Date.now();

    // Filter expired items and by branch
    items = items.filter((item) => {
      const notExpired = !item.expiresAt || item.expiresAt > now;
      const hasQuantity =
        item.availableQuantity === undefined || item.availableQuantity > 0;
      const matchesBranch =
        !branchId ||
        item.branchId === "all" ||
        item.branchId === branchId ||
        (Array.isArray(item.availableBranches) &&
          item.availableBranches.includes(branchId));

      return notExpired && hasQuantity && matchesBranch;
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: items,
      }),
    };
  } catch (error) {
    console.error("Get available redeemables error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to fetch available items",
      }),
    };
  }
};
