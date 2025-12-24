import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = Resource.Slider.name;

export async function main(event: APIGatewayProxyEvent) {
  try {
    const sliderId = event.pathParameters?.id;
    if (!sliderId) return { statusCode: 400, body: JSON.stringify({ message: "Missing sliderId" }) };

    const result = await dynamoDb.send(new GetCommand({ TableName: TABLE_NAME, Key: { sliderId } }));

    if (!result.Item) return { statusCode: 404, body: JSON.stringify({ message: "Slider not found" }) };


    return { statusCode: 200, body: JSON.stringify({ data: result.Item }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: (error as Error).message }) };
  }
}
