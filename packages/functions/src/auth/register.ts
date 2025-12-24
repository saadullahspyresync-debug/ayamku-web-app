import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

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
      "Access-Control-Allow-Origin": "*", // Configure this properly in production
      "Access-Control-Allow-Credentials": "true",
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

    const { fullName, email, password, phone, role = "customer", branchId } = JSON.parse(event.body);

    if (!fullName || !email || !password) {
      return sendResponse(400, "fullName, email and password are required");
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Use Resource to get the actual table name
    const TABLE_NAME = Resource.User.name;

    // Check if email already exists using the GSI
    const existingUserQuery = await dynamoDb.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "emailIndex", // Use the GSI to query by email
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": normalizedEmail,
      },
    }));


    if (existingUserQuery.Items && existingUserQuery.Items.length > 0) {
      return sendResponse(400, "Email already in use");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    const user = {
      userId,
      fullName,
      email: normalizedEmail,
      phone: phone || null,
      password: hashedPassword,
      role,
      selectedBranch: branchId || null,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };


    // Create the user
    await dynamoDb.send(new PutCommand({ 
      TableName: TABLE_NAME, 
      Item: user 
    }));


    // Generate tokens
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    const cookie = `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax; Secure`;


    return sendResponse(201, "User registered successfully", { 
      user: { 
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        selectedBranch: user.selectedBranch,
        isActive: user.isActive,
      }, 
      accessToken 
    }, [cookie]);

  } catch (err: any) {
    console.error("Registration error:", err);
    return sendResponse(500, "Error registering user", { 
      error: err.message || String(err),
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  }
};