import { APIGatewayProxyEvent } from "aws-lambda";
import jwt from "jsonwebtoken";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const TABLE = "Users";
const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, ...data }),
});

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    const cookies = event.headers.Cookie || event.headers.cookie || "";
    const token = cookies.split(";").find(c => c.trim().startsWith("refreshToken="))?.split("=")[1];
    if (!token) return sendResponse(401, "No refresh token provided");

    const payload: any = jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
    const result = await dynamoDb.send(new GetCommand({ TableName: TABLE, Key: { userId: payload.sub } }));

    if (!result.Item) return sendResponse(401, "User not found");

    const newAccessToken = jwt.sign({ sub: result.Item.userId, role: result.Item.role }, process.env.JWT_SECRET!, { expiresIn: "7d" });

    return sendResponse(200, "Access token refreshed", { accessToken: newAccessToken });
  } catch (err) {
    return sendResponse(401, "Invalid or expired refresh token", { error: String(err) });
  }
};
