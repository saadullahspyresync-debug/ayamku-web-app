import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, data }),
});

export const main = async () => {
  try {
    const data = await dynamoDb.send(new ScanCommand({ TableName: Resource.Item.name }));
    const items = data.Items || [];

    return sendResponse(200, "Items fetched successfully", items);
  } catch (error) {
    return sendResponse(500, "Error fetching items", { error: String(error) });
  }
};
