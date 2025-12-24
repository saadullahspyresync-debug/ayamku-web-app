// packages/functions/src/admin/redeemable/delete.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));


export const main = async (event: any) => {
  try {
    const redeemableId = event.pathParameters?.id;

    await dynamoDb.send(
      new DeleteCommand({
        TableName: Resource.RedeemableItem.name,
        Key: { redeemableId },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Redeemable item deleted successfully",
      }),
    };
  } catch (error) {
    console.error("Delete redeemable error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to delete redeemable item",
      }),
    };
  }
};