import { APIGatewayProxyEvent } from "aws-lambda";
import cookie from "cookie";

const sendResponse = (status: number, message: string, cookies?: string[]) => ({
  statusCode: status,
  headers: cookies ? { "Set-Cookie": cookies } : undefined,
  body: JSON.stringify({ message }),
});

export const main = async (event: APIGatewayProxyEvent, user?: any) => {
  try {
    const cookie = "refreshToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict";
    return sendResponse(200, "Logged out successfully", [cookie]);
  } catch (err) {
   const cookieValue = "refreshToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict";
return sendResponse(200, "Logged out successfully", [cookieValue]);
  }
};
