import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const TABLE = Resource.Item.name;
const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, ...data }),
});

export const main = async () => {
  try {
    const result = await dynamoDb.send(new ScanCommand({
      TableName: TABLE,
      FilterExpression: "isCombo = :isCombo",
      ExpressionAttributeValues: { ":isCombo": true }
    }));

    return sendResponse(200, "Deals fetched successfully", { data: result.Items });
  } catch (err) {
    return sendResponse(500, "Error fetching deals", { error: String(err) });
  }
};
