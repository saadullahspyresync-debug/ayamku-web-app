import * as uuid from "uuid";
import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = Resource.SeasonalHighlight.name;
const BASE_URL = process.env.BACKEND_URL || "http://localhost:5000";

export async function main(event: APIGatewayProxyEvent) {
  try {
    if (!event.body) throw new Error("Missing request body");
    const data = JSON.parse(event.body);

    if (data.fileName) {
      data.image = `${BASE_URL}/uploads/highlights/${data.fileName}`;
    }

    const item = {
      highlightId: uuid.v4(),
      ...data,
      status: data.status || "active",
      createdAt: Date.now(),
    };

    await dynamoDb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }));


    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Highlight created successfully", data: item }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
}
