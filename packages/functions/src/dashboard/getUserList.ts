import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const USER_TABLE = Resource.User.name;

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, data }),
});

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    const queryParams = event.queryStringParameters || {};
    const { role, isActive, search, page = "1", limit = "20" } = queryParams;

    const limitNum = Number(limit);
    const pageNum = Number(page);
    const skip = (pageNum - 1) * limitNum;

    let filterExpression = "";
    const expressionValues: Record<string, any> = {};

    if (role) {
      filterExpression += "role = :role";
      expressionValues[":role"] = role;
    }
    if (isActive !== undefined) {
      if (filterExpression) filterExpression += " AND ";
      filterExpression += "isActive = :isActive";
      expressionValues[":isActive"] = isActive === "true";
    }

    const usersData = await dynamoDb.send(new ScanCommand({
      TableName: USER_TABLE,
      FilterExpression: filterExpression || undefined,
      ExpressionAttributeValues: Object.keys(expressionValues).length ? expressionValues : undefined,
    }));

    let users = usersData.Items || [];

    if (search) {
      const searchRegex = new RegExp(search, "i");
      users = users.filter(u => searchRegex.test(u.fullName) || searchRegex.test(u.email));
    }

    const total = users.length;
    const paginated = users.slice(skip, skip + limitNum);

    return sendResponse(200, "User list fetched successfully", {
      users: paginated,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return sendResponse(500, "Error fetching user list", { error: String(error) });
  }
};
