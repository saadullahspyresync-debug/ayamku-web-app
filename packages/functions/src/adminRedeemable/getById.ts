// packages/functions/src/admin/redeemable/getById.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));


export const main = async (event: any) => {
  try {
    const redeemableId = event.pathParameters?.id;

    const result = await dynamoDb.send(
      new GetCommand({
        TableName: Resource.RedeemableItem.name,
        Key: { redeemableId },
      })
    );

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          message: "Redeemable item not found",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: result.Item,
      }),
    };
  } catch (error) {
    console.error("Get redeemable by ID error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to fetch redeemable item",
      }),
    };
  }
};
