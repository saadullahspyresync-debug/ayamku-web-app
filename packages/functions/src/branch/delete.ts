// src/functions/branch/delete.ts
import { Resource } from "sst";
import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { TABLES } from "../../../../infra/runtime";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export async function main(event: APIGatewayProxyEvent) {
  
  const { id } = event.pathParameters || {};
  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ error: "Branch ID is required" }) };
  }

  const params = {
    TableName: Resource.Branch.name,
    Key: { branchId: id },
  };

  try {
    await dynamoDb.send(new DeleteCommand(params));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Branch deleted successfully" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
    };
  }
}
