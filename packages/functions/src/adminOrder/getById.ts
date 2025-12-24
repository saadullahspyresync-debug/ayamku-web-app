import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ORDER_TABLE = Resource.Order.name;
const BRANCH_TABLE = Resource.Branch.name;
const USER_TABLE = Resource.User.name;

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, data }),
});

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    const { id } = event.pathParameters || {};
    if (!id) return sendResponse(400, "Order id required");

    // Get order
    const orderResult = await dynamoDb.send(
      new GetCommand({ TableName: ORDER_TABLE, Key: { orderId: id } })
    );
    const order = orderResult.Item;
    if (!order) return sendResponse(404, "Order not found");

    let branch: any = null;
    let user: any = null;

    // Get branch if branchId exists
    if (order.branchId) {
      const branchResult = await dynamoDb.send(
        new GetCommand({ TableName: BRANCH_TABLE, Key: { branchId: order.branchId } })
      );
      branch = branchResult.Item || null;
    }

    // Get user if userId exists
    if (order.userId) {
      const userResult = await dynamoDb.send(
        new GetCommand({ TableName: USER_TABLE, Key: { userId: order.userId } })
      );
      user = userResult.Item || null;
    }

    // Return populated order
    return sendResponse(200, "Order fetched successfully", {
      ...order,
      branch,
      user,
    });

  } catch (error) {
    console.error("Error fetching order:", error);
    return sendResponse(500, "Error fetching order", { error: String(error) });
  }
};
