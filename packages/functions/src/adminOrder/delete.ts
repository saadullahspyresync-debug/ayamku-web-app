import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";


const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const TABLE = Resource.Order.name;

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, data }),
});

export const main = async (event: APIGatewayProxyEvent, user?: any) => {
  try {
    const { id } = event.pathParameters || {};
    if (!id) return sendResponse(400, "Order id required");

    const existingOrder = await dynamoDb.send(new GetCommand({ TableName: TABLE, Key: { orderId: id } }));
    if (!existingOrder.Item) return sendResponse(404, "Order not found");

    await dynamoDb.send(new DeleteCommand({ TableName: TABLE, Key: { orderId: id } }));


    return sendResponse(200, "Order deleted successfully");
  } catch (error) {
    return sendResponse(500, "Error deleting order", { error: String(error) });
  }
};
