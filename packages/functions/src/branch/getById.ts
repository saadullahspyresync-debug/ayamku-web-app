// src/functions/branch/getById.ts
import { Resource } from "sst";
import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
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
    const result = await dynamoDb.send(new GetCommand(params));

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Branch not found", code: "BRANCH_NOT_FOUND" }),
      };
    }

    const branchWithLink = {
      ...result.Item,
      mapLink: `https://www.google.com/maps?q=${result.Item.coordinates?.lat},${result.Item.coordinates?.lng}`,
    };

    return {
      statusCode: 200,
      body: JSON.stringify({ data: branchWithLink }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
    };
  }
}
