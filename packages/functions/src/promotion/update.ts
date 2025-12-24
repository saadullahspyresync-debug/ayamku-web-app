import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient, ReturnValue } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
});

export const main = async (event: APIGatewayProxyEvent, user?: any) => {
  try {
    const { id } = event.pathParameters || {};
    
    if (!id || !event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Promotion ID and body are required" }),
      };
    }

    const updates = JSON.parse(event.body);

    // Get existing promotion
    const existingPromoData = await dynamoDb.send(
      new GetCommand({
        TableName: Resource.Promotion.name,
        Key: { promotionId: id },
      })
    );

    const existingPromo = existingPromoData.Item;
    if (!existingPromo) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Promotion not found" }),
      };
    }

    // ✅ Remove primary key from updates
    delete updates.promotionId;

    // Normalize items to array
    if (updates.items && !Array.isArray(updates.items)) {
      updates.items = [updates.items];
    }

    // Normalize toys to array
    if (updates.toys && !Array.isArray(updates.toys)) {
      updates.toys = [updates.toys];
    }

    // Normalize branchIds to array
    if (updates.branchIds && !Array.isArray(updates.branchIds)) {
      updates.branchIds = [updates.branchIds];
    }

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
      TableName: Resource.Promotion.name,
      Key: { promotionId: id },
      UpdateExpression: "SET " + updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      ReturnValues: "ALL_NEW" as ReturnValue,
    };

    const result = await dynamoDb.send(new UpdateCommand(params));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Promotion updated successfully",
        data: result.Attributes,
      }),
    };
  } catch (error) {
    console.error("Promotion update error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};