import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const TABLE = Resource.Category.name;
const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, ...data }),
});

export const main = async () => {
  try {
    const result = await dynamoDb.send(new ScanCommand({ TableName: TABLE }));
    return {
      statusCode: 200,
      body: JSON.stringify({ data: result.Items }),
    };
  } catch (err) {
    return sendResponse(500, "Error fetching categories", { error: String(err) });
  }
};
