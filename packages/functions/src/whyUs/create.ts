import * as uuid from "uuid";
import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = Resource.WhyUs.name;

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, ...data }),
});

export async function main(event: APIGatewayProxyEvent) {
  try {
    if (!event.body) return sendResponse(400, "No body provided");
    const data = JSON.parse(event.body);

    const item = {
      id: uuid.v4(),
      title: data.title,
      description: data.description,
      imageUrl: data.image,
      createdAt: Date.now(),
    };

    await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

    return sendResponse(201, "Item added successfully", item);
  } catch (error) {
    return sendResponse(500, "Error adding item", { error: (error as Error).message });
  }
}