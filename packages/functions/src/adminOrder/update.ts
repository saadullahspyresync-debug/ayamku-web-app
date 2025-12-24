import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
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
    if (!event.body) return sendResponse(400, "No body provided");

    const body = JSON.parse(event.body);

    const existingOrder = await dynamoDb.send(new GetCommand({ TableName: TABLE, Key: { orderId: id } }));
    if (!existingOrder.Item) return sendResponse(404, "Order not found");

    const updatedOrder = { ...existingOrder.Item, ...body };

    await dynamoDb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { orderId: id },
      UpdateExpression: "SET #data = :data",
      ExpressionAttributeNames: { "#data": "data" },
      ExpressionAttributeValues: { ":data": updatedOrder },
    }));


    return sendResponse(200, "Order updated successfully", updatedOrder);
  } catch (error) {
    return sendResponse(500, "Error updating order", { error: String(error) });
  }
};
