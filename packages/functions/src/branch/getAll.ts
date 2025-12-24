// src/functions/branch/getAll.ts
import { Resource } from "sst";
import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ScanCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { TABLES } from "../../../../infra/runtime";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export async function main(event: APIGatewayProxyEvent) {
  const { status, service } = event.queryStringParameters || {};

  const filterExpressions: string[] = [];
  const expressionValues: Record<string, any> = {};

  if (status) {
    filterExpressions.push("#status = :status");
    expressionValues[":status"] = status;
  }

  if (service) {
    filterExpressions.push(`#services.#${service} = :true`);
    expressionValues[":true"] = true;
  }

  const params: any = {
    TableName: Resource.Branch.name,
  };

  if (filterExpressions.length) {
    params.FilterExpression = filterExpressions.join(" AND ");
    params.ExpressionAttributeValues = expressionValues;
    params.ExpressionAttributeNames = {
      "#status": "status",
      "#services": "services",
    };
    if (service) {
      params.ExpressionAttributeNames[`#${service}`] = service;
    }
  }

  try {
    const result = await dynamoDb.send(new ScanCommand(params));

    return {
      statusCode: 200,
      body: JSON.stringify({ data: result.Items }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
    };
  }
}
