import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = Resource.Promotion.name;

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, data }),
});

export const main = async () => {
  try {
    const now = new Date().toISOString();

    // 1. Scan for expired promotions
    const scanResult = await dynamoDb.send(
      new ScanCommand({
        TableName: TABLE,
        FilterExpression: "endDate < :now",
        ExpressionAttributeValues: {
          ":now": now,
        },
      })
    );

    const expiredPromos = scanResult.Items || [];
    if (expiredPromos.length === 0) {
      return sendResponse(200, "No expired promotions found");
    }

    // 2. Delete each expired promotion
    for (const promo of expiredPromos) {
      await dynamoDb.send(
        new DeleteCommand({
          TableName: TABLE,
          Key: { promotionId: promo.promotionId },
        })
      );
    }

    return sendResponse(200, "Expired promotions deleted", { deleted: expiredPromos.length });
  } catch (error) {
    return sendResponse(500, "Error auto-deleting expired promotions", {
      error: String(error),
    });
  }
};
