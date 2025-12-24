// packages/functions/src/admin/redeemable/update.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));


export const main = async (event: any) => {
  try {
    const redeemableId = event.pathParameters?.id;
    const body = JSON.parse(event.body);

    // Get existing item
    const existing = await dynamoDb.send(
      new GetCommand({
        TableName: Resource.RedeemableItem.name,
        Key: { redeemableId },
      })
    );

    if (!existing.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          message: "Redeemable item not found",
        }),
      };
    }

    const updated = {
      ...existing.Item,
      name: body.name ?? existing.Item.name,
      description: body.description ?? existing.Item.description,
      pointsCost: body.pointsCost ?? existing.Item.pointsCost,
      images: body.images ?? existing.Item.images,
      status: body.status ?? existing.Item.status,
      branchId: body.branchId ?? existing.Item.branchId,
      availableQuantity: body.availableQuantity ?? existing.Item.availableQuantity,
      expiresAt: body.expiresAt ?? existing.Item.expiresAt,
      updatedAt: Date.now(),
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: Resource.RedeemableItem.name,
        Item: updated,
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: updated,
        message: "Redeemable item updated successfully",
      }),
    };
  } catch (error) {
    console.error("Update redeemable error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to update redeemable item",
      }),
    };
  }
};