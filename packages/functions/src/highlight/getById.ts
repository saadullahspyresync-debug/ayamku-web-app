import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = Resource.SeasonalHighlight.name;

export async function main(event: APIGatewayProxyEvent) {
  try {
    const highlightId = event.pathParameters?.id;
    if (!highlightId) return { statusCode: 400, body: JSON.stringify({ message: "Missing highlightId" }) };

    const result = await dynamoDb.send(new GetCommand({ TableName: TABLE_NAME, Key: { highlightId } }));
    if (!result.Item) return { statusCode: 404, body: JSON.stringify({ message: "Highlight not found" }) };


    return { statusCode: 200, body: JSON.stringify({ data: result.Item }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: (error as Error).message }) };
  }
}
