import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { Resource } from "sst";

const TABLE = Resource.Item.name;
const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, ...data }),
});

export const main = async (event: APIGatewayProxyEvent, user?: any) => {
  try {
    if (!event.body) return sendResponse(400, "Request body missing");
    const body = JSON.parse(event.body);

    const itemId = uuidv4();
    const deal = { ...body, itemId, isCombo: true, createdAt: Date.now(), updatedAt: Date.now() };

    await dynamoDb.send(new PutCommand({ TableName: TABLE, Item: deal }));


    return sendResponse(201, "Deal created successfully",deal );
  } catch (err) {
    return sendResponse(500, "Error creating deal", { error: String(err) });
  }
};
