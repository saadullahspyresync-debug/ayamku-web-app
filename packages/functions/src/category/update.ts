// import { Resource } from "sst";
// import { APIGatewayProxyEvent } from "aws-lambda";
// import { DynamoDBClient, ReturnValue } from "@aws-sdk/client-dynamodb";
// import { UpdateCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// export async function main(event: APIGatewayProxyEvent) {
//   const { id } = event.pathParameters || {};
//   if (!id || !event.body) {
//     return {
//       statusCode: 400,
//       body: JSON.stringify({ error: "Category ID and body are required" }),
//     };
//   }

//   const updates = JSON.parse(event.body);

//   // Prevent empty updates
//   if (Object.keys(updates).length === 0) {
//     return {
//       statusCode: 400,
//       body: JSON.stringify({ error: "No fields provided for update" }),
//     };
//   }

//   // Auto-add lowercased name if name is updated
//   if (updates.name) {
//     updates.nameLower = updates.name.toLowerCase();
//   }

//   // Always update timestamp
//   updates.updatedAt = Date.now();

//   // Build expressions
//   const updateExpression = Object.keys(updates)
//     .map((key) => `#${key} = :${key}`)
//     .join(", ");

//   const expressionAttributeValues = Object.fromEntries(
//     Object.entries(updates).map(([k, v]) => [`:${k}`, v])
//   );

//   const expressionAttributeNames = Object.fromEntries(
//     Object.keys(updates).map((k) => [`#${k}`, k])
//   );

//   const params = {
//     TableName: Resource.Category.name,
//     Key: { categoryId: id },
//     UpdateExpression: "SET " + updateExpression,
//     ExpressionAttributeValues: expressionAttributeValues,
//     ExpressionAttributeNames: expressionAttributeNames,
//     ReturnValues: "ALL_NEW" as ReturnValue,
//   };

//   try {
//     const result = await dynamoDb.send(new UpdateCommand(params));

//     return {
//       statusCode: 200,
//       body: JSON.stringify({
//         message: "Category updated successfully",
//         data: result.Attributes,
//       }),
//     };
//   } catch (error) {
//     console.error("Category update error:", error);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({
//         error: error instanceof Error ? error.message : String(error),
//       }),
//     };
//   }
// }
import { Resource } from "sst";
import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient, ReturnValue } from "@aws-sdk/client-dynamodb";
import { UpdateCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const BASE_URL = process.env.BASE_URL || "http://localhost:5000"; // 👈 for image URLs

export async function main(event: APIGatewayProxyEvent) {
  const { id } = event.pathParameters || {};
  if (!id || !event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Category ID and body are required" }),
    };
  }

  const updates = JSON.parse(event.body);

  // ✅ Prevent empty updates
  if (Object.keys(updates).length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No fields provided for update" }),
    };
  }

  // ✅ Handle fileName → image mapping
  if (updates.fileName) {
    updates.image = `${BASE_URL}/uploads/${updates.fileName}`;
  }

  // ✅ Auto-add lowercased name if name is updated
  if (updates.name) {
    updates.nameLower = updates.name.toLowerCase();
  }

  // ✅ Always update timestamp
  updates.updatedAt = Date.now();

  // ✅ Build DynamoDB update expressions
  const updateExpression = Object.keys(updates)
    .map((key) => `#${key} = :${key}`)
    .join(", ");

  const expressionAttributeValues = Object.fromEntries(
    Object.entries(updates).map(([k, v]) => [`:${k}`, v])
  );

  const expressionAttributeNames = Object.fromEntries(
    Object.keys(updates).map((k) => [`#${k}`, k])
  );

  const params = {
    TableName: Resource.Category.name,
    Key: { categoryId: id },
    UpdateExpression: "SET " + updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    ReturnValues: "ALL_NEW" as ReturnValue,
  };

  try {
    const result = await dynamoDb.send(new UpdateCommand(params));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Category updated successfully",
        data: result.Attributes,
      }),
    };
  } catch (error) {
    console.error("❌ Category update error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
}
