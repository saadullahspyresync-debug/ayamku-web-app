import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = Resource.User.name;

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, data }),
});

export const main = async () => {
  try {
    const data = await dynamoDb.send(new ScanCommand({ TableName: TABLE }));
    const users = (data.Items || []).map(u => {
      const { password, ...rest } = u;
      return rest;
    });
    return sendResponse(200, "Users fetched successfully", users);
  } catch (error) {
    return sendResponse(500, "Error fetching users", { error: String(error) });
  }
};
