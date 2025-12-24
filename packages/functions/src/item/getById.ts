import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, data }),
});

export const main = async (event: APIGatewayProxyEvent) => {
  console.log('Table name', Resource.Item.name)
  try {
    const { id } = event.pathParameters || {};
    if (!id) return sendResponse(400, "Item id required");
    // console.log('id from function', id)
    const result = await dynamoDb.send(new GetCommand({
      TableName: Resource.Item.name,
      Key: { itemId: id },
    }));
    // console.log('result from function', result)

    if (!result.Item) return sendResponse(404, "Item not found");

    return sendResponse(200, "Item fetched successfully", result.Item);
  } catch (error) {
    return sendResponse(500, "Error fetching item", { error: String(error) });
  }
};
