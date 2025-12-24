import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

const USERS_TABLE = "Users";
const OTP_TABLE = "PasswordResetOtps";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, ...data }),
});

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    if (!event.body) return sendResponse(400, "Request body missing");
    const { email } = JSON.parse(event.body);

    if (!email) return sendResponse(400, "Email is required");

    const userResult = await dynamoDb.send(new GetCommand({ TableName: USERS_TABLE, Key: { userId: email } }));
    const user = userResult.Item;
    if (!user) return sendResponse(404, "User not found");

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(12);
    const otpHash = await bcrypt.hash(otp, salt);

    const otpRecord = {
      userId: user.userId,
      otpHash,
      otpSalt: salt,
      expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
      consumedAt: null,
      attempts: 0,
      createdAt: Date.now(),
    };

    await dynamoDb.send(new PutCommand({ TableName: OTP_TABLE, Item: otpRecord }));

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?email=${encodeURIComponent(email)}`;
    // await sendOtpMail(user.email, otp, resetUrl);


    return sendResponse(200, "OTP sent to your email", {
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    });
  } catch (err) {
    return sendResponse(500, "Error requesting OTP", { error: String(err) });
  }
};
