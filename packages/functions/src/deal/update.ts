import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient, ReturnValue } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: {
    removeUndefinedValues: true, // ✅ Remove undefined values
    convertEmptyValues: false,
  },
});

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    const { id } = event.pathParameters || {};
    
    if (!id || !event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Deal ID and body are required" }),
      };
    }

    const updates = JSON.parse(event.body);

    // Get existing deal
    const existingDealData = await dynamoDb.send(
      new GetCommand({
        TableName: Resource.Item.name,
        Key: { itemId: id },
      })
    );

    const existingDeal = existingDealData.Item;
    if (!existingDeal || !existingDeal.isCombo) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Deal not found" }),
      };
    }

    // Normalize comboItems to ensure proper structure
    if (updates.comboItems && Array.isArray(updates.comboItems)) {
      updates.comboItems = updates.comboItems
        .filter((item: any) => item && item.itemId) // ✅ Filter out invalid items
        .map((item: any) => ({
          itemId: item.itemId,
          name: item.name,
          quantity: parseInt(item.quantity) || 1,
        }));
    }

    // Normalize availableBranches to array
    if (updates.availableBranches && !Array.isArray(updates.availableBranches)) {
      updates.availableBranches = [updates.availableBranches];
    }

    // Ensure isCombo remains true
    updates.isCombo = true;

    // Always update timestamp
    updates.updatedAt = Date.now();

    // Remove any undefined, null, or empty string values recursively
    const cleanObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj
          .map(item => cleanObject(item))
          .filter(item => item !== undefined && item !== null && item !== '');
      }
      
      if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
          Object.entries(obj)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, cleanObject(v)])
        );
      }
      
      return obj;
    };

    const cleanedUpdates = cleanObject(updates);

    // Prevent empty updates
    if (Object.keys(cleanedUpdates).length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No valid fields provided for update" }),
      };
    }

    // Build dynamic update expressions
    const updateExpression = Object.keys(cleanedUpdates)
      .map((key) => `#${key} = :${key}`)
      .join(", ");

    const expressionAttributeValues = Object.fromEntries(
      Object.entries(cleanedUpdates).map(([k, v]) => [`:${k}`, v])
    );

    const expressionAttributeNames = Object.fromEntries(
      Object.keys(cleanedUpdates).map((k) => [`#${k}`, k])
    );

    const params = {
      TableName: Resource.Item.name,
      Key: { itemId: id },
      UpdateExpression: "SET " + updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      ReturnValues: "ALL_NEW" as ReturnValue,
    };

    const result = await dynamoDb.send(new UpdateCommand(params));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Deal updated successfully",
        data: result.Attributes,
      }),
    };
  } catch (error) {
    console.error("Deal update error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};