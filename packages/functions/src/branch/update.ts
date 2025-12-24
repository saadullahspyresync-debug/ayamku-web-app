// src/functions/branch/update.ts
import { Resource } from "sst";
import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient, ReturnValue } from "@aws-sdk/client-dynamodb";
import { UpdateCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { TABLES } from "../../../../infra/runtime";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export async function main(event: APIGatewayProxyEvent) {
  const { id } = event.pathParameters || {};
  if (!id || !event.body) {
    return { statusCode: 400, body: JSON.stringify({ error: "Branch ID and body are required" }) };
  }

  const updates = JSON.parse(event.body);
  const updateExpression = [];
  const expressionAttributeValues: Record<string, any> = {};

  for (const key in updates) {
    updateExpression.push(`#${key} = :${key}`);
    expressionAttributeValues[`:${key}`] = updates[key];
  }

  const params = {
    TableName: Resource.Branch.name,
    Key: { branchId: id },
    UpdateExpression: "SET " + updateExpression.join(", "),
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: Object.fromEntries(Object.keys(updates).map(k => [`#${k}`, k])),
    ReturnValues: "ALL_NEW" as ReturnValue
  };

  try {
    const result = await dynamoDb.send(new UpdateCommand(params));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Branch updated successfully", data: result.Attributes }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
    };
  }
}
