import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const USER_TABLE = Resource.User.name;
const ACTIVITY_TABLE = Resource.ActivityLog.name;

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, data }),
});

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    const totalUsersData = await dynamoDb.send(new ScanCommand({ TableName: USER_TABLE }));
    const totalUsers = totalUsersData.Count || 0;

    const activeUsersData = await dynamoDb.send(new ScanCommand({
      TableName: USER_TABLE,
      FilterExpression: "isActive = :active",
      ExpressionAttributeValues: { ":active": true },
    }));
    const activeUsers = activeUsersData.Count || 0;

    const adminsData = await dynamoDb.send(new ScanCommand({
      TableName: USER_TABLE,
      FilterExpression: "role = :role",
      ExpressionAttributeValues: { ":role": "admin" },
    }));
    const admins = adminsData.Count || 0;

    const customersData = await dynamoDb.send(new ScanCommand({
      TableName: USER_TABLE,
      FilterExpression: "role = :role",
      ExpressionAttributeValues: { ":role": "customer" },
    }));
    const customers = customersData.Count || 0;

    const since = Date.now() - 24 * 60 * 60 * 1000;
    const recentActivitiesData = await dynamoDb.send(new ScanCommand({
      TableName: ACTIVITY_TABLE,
      FilterExpression: "createdAt >= :since",
      ExpressionAttributeValues: { ":since": since },
    }));
    const recentActivitiesCount = recentActivitiesData.Count || 0;

    return sendResponse(200, "Dashboard stats fetched successfully", {
      totalUsers,
      activeUsers,
      admins,
      customers,
      recentActivitiesCount,
    });
  } catch (error) {
    return sendResponse(500, "Error fetching dashboard stats", { error: String(error) });
  }
};
