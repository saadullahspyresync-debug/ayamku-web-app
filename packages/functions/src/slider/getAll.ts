import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = Resource.Slider.name;

export async function main(event: APIGatewayProxyEvent) {
  try {
    const result = await dynamoDb.send(new ScanCommand({ TableName: TABLE_NAME }));

    const items = result.Items || [];

    // Sort by 'order' if present
    items.sort((a, b) => (a.order || 0) - (b.order || 0));


    return { statusCode: 200, body: JSON.stringify({ data: items }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: (error as Error).message }) };
  }
}
