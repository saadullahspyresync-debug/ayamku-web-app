import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = Resource.WhyUs.name;

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, ...data }),
});

export async function main(event: APIGatewayProxyEvent) {
  try {
    // ScanCommand retrieves all items from the table
    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
      })
    );

    // Return the items array (defaulting to empty if no items found)
    return sendResponse(200, "Items retrieved successfully", {
      data: result.Items ?? [],
      count: result.Count ?? 0,
    });
  } catch (error) {
    return sendResponse(500, "Error retrieving items", { 
      error: (error as Error).message 
    });
  }
}