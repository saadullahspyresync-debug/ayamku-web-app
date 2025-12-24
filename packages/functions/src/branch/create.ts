// src/functions/branch/create.ts
import * as uuid from "uuid";
import { Resource } from "sst";
import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export async function main(event: APIGatewayProxyEvent) {
  
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Request body is missing" }),
    };
  }

  const data = JSON.parse(event.body);

  // Check if branch exists logic (using DynamoDB Query)
  // Assuming 'Branches' table with primary key 'branchId'
  // and a GSI on name+address+contactNumber for uniqueness check
  const branchId = uuid.v1();
  const params = {
    TableName: Resource.Branch.name,
    Item: {
      branchId,
      ...data,
      createdAt: Date.now(),
    },
  };

  try {
    await dynamoDb.send(new PutCommand(params));

    return {
      statusCode: 201,
      body: JSON.stringify({
        status: 201,
        message: "Branch created successfully",
        data: params.Item,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
    };
  }
}
