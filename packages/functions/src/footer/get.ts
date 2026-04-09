import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = Resource.Footer.name;

const sendResponse = (status: number, data?: any) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data || {}),
});

export async function main() {
  try {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          id: "settings", // The unique ID we chose for the footer config
        },
      })
    );

    if (!result.Item) {
      return sendResponse(200, {
        quickLinks: { exploreMenu: "", restaurantLocator: "", contactUs: "", aboutUs: "" },
        contactInfo: { address1: "", address2: "", phone: "", email: "" }
      });
    }

    return sendResponse(200, result.Item);
  } catch (error) {
    return sendResponse(500, { 
        message: "Error retrieving footer data", 
        error: (error as Error).message 
    });
  }
}