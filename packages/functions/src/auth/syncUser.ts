import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));


export const main = async (event: any) => {
  console.log("🟢 Incoming /auth/syncUser event:", event);

  try {
    const body = JSON.parse(event.body || "{}");
    console.log("🟢 Incoming /auth/syncUser body:", body);

    // ✅ The frontend can send `idToken` or we can decode it via authorizer
    // But since your frontend already has idToken payload, send that body directly

    const {
      sub,
      email,
      name,
      phone_number,
      "cognito:groups": groups = [],
      email_verified,
      phone_number_verified,
    } = body;

    if (!sub || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing userId or email" }),
      };
    }

    const userItem = {
      userId: sub,
      fullName: name || "",
      email,
      phone: phone_number || "",
      emailVerified: !!email_verified,
      phoneVerified: !!phone_number_verified,
      role: groups.length > 0 ? groups[0] : "Customer",
      points: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      raw: body, // optional — saves full payload for debugging
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: Resource.User.name,
        Item: userItem,
      })
    );

    console.log("✅ User saved to DynamoDB:", userItem);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "User synced successfully",
        user: userItem,
      }),
    };
  } catch (error) {
    console.error("❌ Error saving user:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
