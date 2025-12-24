import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ACTIVITY_TABLE = Resource.ActivityLog.name;

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, data }),
});

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    const queryParams = event.queryStringParameters || {};
    const limit = Number(queryParams.limit || 20);

    const activitiesData = await dynamoDb.send(new ScanCommand({ TableName: ACTIVITY_TABLE }));
    const sorted = (activitiesData.Items || []).sort((a, b) => b.createdAt - a.createdAt);
    const activities = sorted.slice(0, limit);

    return sendResponse(200, "Recent activities fetched successfully", activities);
  } catch (error) {
    return sendResponse(500, "Error fetching recent activities", { error: String(error) });
  }
};
