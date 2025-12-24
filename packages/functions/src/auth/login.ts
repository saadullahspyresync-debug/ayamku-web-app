import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const secrets = {
  JWT_SECRET: process.env.JWT_SECRET || "your-dev-secret",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "your-dev-refresh-secret",
};

function signAccessToken(user: any) {
  if (!secrets.JWT_SECRET) throw new Error("JWT_SECRET is not set");
  return jwt.sign({ sub: user.userId, role: user.role }, secrets.JWT_SECRET, { expiresIn: "7d" });
}

function signRefreshToken(user: any) {
  if (!secrets.JWT_REFRESH_SECRET) throw new Error("JWT_REFRESH_SECRET is not set");
  return jwt.sign({ sub: user.userId }, secrets.JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

const sendResponse = (status: number, message: string, data?: any, cookies?: string[]) => {
  const response: any = {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // Configure properly for production
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    },
    body: JSON.stringify({ message, ...data }),
  };

  if (cookies && cookies.length > 0) {
    response.headers["Set-Cookie"] = cookies.join(", ");
  }

  return response;
};

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    
    if (!event.body) return sendResponse(400, "Request body missing");
    
    const { email, password } = JSON.parse(event.body);
    if (!email || !password) return sendResponse(400, "email and password required");

    const normalizedEmail = String(email).toLowerCase().trim();

    // Use Resource to get the actual table name
    const TABLE_NAME = Resource.User.name;

    // Query using the Global Secondary Index on email
    const result = await dynamoDb.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "emailIndex",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": normalizedEmail,
      },
    }));


    // Check if user exists
    if (!result.Items || result.Items.length === 0) {
      return sendResponse(401, "Invalid credentials");
    }

    const user = result.Items[0];

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return sendResponse(401, "Invalid credentials");
    }

    // Check if user is active
    if (!user.isActive) {
      return sendResponse(403, "Account is suspended");
    }

    // Generate tokens
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    const cookie = `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax; Secure`;

    const branch = user.selectedBranch || null;


    return sendResponse(200, "Login successful", { 
      user: { 
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        selectedBranch: user.selectedBranch,
        isActive: user.isActive,
      }, 
      accessToken, 
      branch,
    }, [cookie]);

  } catch (err: any) {
    console.error("Login error:", err);
    return sendResponse(500, "Error logging in", { 
      error: err.message || String(err),
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  }
};