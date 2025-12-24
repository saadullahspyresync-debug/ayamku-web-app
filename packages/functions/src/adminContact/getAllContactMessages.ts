// packages/functions/src/admin/getAllContactMessages.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

// Reference your ContactForm table from SST
const TABLE = Resource.ContactForm.name;

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  },
  body: JSON.stringify({ message, ...data }),
});

export const main = async () => {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: TABLE }));
    return sendResponse(200, "Contact messages fetched successfully", {
      data: result.Items,
    });
  } catch (err) {
    console.error("Error fetching contact messages:", err);
    return sendResponse(500, "Error fetching contact messages", { error: String(err) });
  }
};
