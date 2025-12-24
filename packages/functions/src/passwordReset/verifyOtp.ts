import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";

const OTP_TABLE = "PasswordResetOtps";
const USERS_TABLE = "Users";
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, ...data }),
});

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    if (!event.body) return sendResponse(400, "Request body missing");
    const { email, otp, newPassword } = JSON.parse(event.body);

    if (!email || !otp || !newPassword) return sendResponse(400, "Email, OTP, and newPassword are required");

    const userResult = await dynamoDb.send(new GetCommand({ TableName: USERS_TABLE, Key: { userId: email } }));
    const user = userResult.Item;
    if (!user) return sendResponse(404, "User not found");

    const otpResult = await dynamoDb.send(new GetCommand({ TableName: OTP_TABLE, Key: { userId: email } }));
    const otpDoc = otpResult.Item;
    if (!otpDoc) return sendResponse(400, "No OTP request found");

    if (otpDoc.consumedAt) return sendResponse(400, "OTP has already been used");
    if (otpDoc.expiresAt < Date.now()) return sendResponse(400, "OTP has expired");
    if (otpDoc.attempts >= MAX_ATTEMPTS) return sendResponse(429, "Too many attempts, request new OTP");

    const isValid = await bcrypt.compare(otp, otpDoc.otpHash);
    if (!isValid) {
      await dynamoDb.send(new UpdateCommand({
        TableName: OTP_TABLE,
        Key: { userId: email },
        UpdateExpression: "SET attempts = attempts + :inc",
        ExpressionAttributeValues: { ":inc": 1 },
      }));
      return sendResponse(400, "Invalid OTP");
    }

    // ✅ Update user password (hashing handled before save)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await dynamoDb.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId: email },
      UpdateExpression: "SET password = :pwd",
      ExpressionAttributeValues: { ":pwd": hashedPassword },
    }));

    // ✅ Mark OTP as used
    await dynamoDb.send(new UpdateCommand({
      TableName: OTP_TABLE,
      Key: { userId: email },
      UpdateExpression: "SET consumedAt = :time",
      ExpressionAttributeValues: { ":time": Date.now() },
    }));


    return sendResponse(200, "Password has been reset successfully");
  } catch (err) {
    return sendResponse(500, "Error verifying OTP", { error: String(err) });
  }
};
