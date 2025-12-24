// packages/functions/src/admin/redeemable/create.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { ulid } from "ulid";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));


export const main = async (event: any) => {
  try {
    const body = JSON.parse(event.body);
    const userId = event.requestContext?.authorizer?.lambda?.userId;

    const redeemableId = ulid();
    const now = Date.now();

    const item = {
      redeemableId,
      name: body.name,
      description: body.description || "",
      pointsCost: body.pointsCost,
      image: body.image || [],
      status: body.status || "active",
      branchId: body.branchId || "all",
      availableQuantity: body.availableQuantity ? body.availableQuantity : 1,
      redeemedCount: 0,
      expiresAt: body.expiresAt,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: Resource.RedeemableItem.name,
        Item: item,
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        data: item,
        message: "Redeemable item created successfully",
      }),
    };
  } catch (error) {
    console.error("Create redeemable error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to create redeemable item",
      }),
    };
  }
};