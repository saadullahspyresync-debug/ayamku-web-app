import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { 
  CognitoIdentityProviderClient, 
  AdminUpdateUserAttributesCommand 
} from "@aws-sdk/client-cognito-identity-provider";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = Resource.BranchManager.name;
const cognito = new CognitoIdentityProviderClient({});
const USER_POOL_ID = Resource.UserPool.id;

const sendResponse = (status: number, body: any) => ({
  statusCode: status,
  body: JSON.stringify(body),
});

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    /* ================= AUTH ================= */
    const auth = (event.requestContext as any)?.authorizer?.lambda;
    if (!auth || auth.userRole !== "Admin") {
      return sendResponse(403, { message: "Unauthorized" });
    }

    /* ================= PATH PARAM ================= */
    const userId = event.pathParameters?.id;
    if (!userId || !event.body) {
      return sendResponse(400, { message: "Missing userId or body" });
    }

    const { branchId } = JSON.parse(event.body);

    if (!branchId) {
      return sendResponse(400, { message: "branchId is required" });
    }

    /* ================= 1. UPDATE DYNAMODB ================= */
    // Because PK is now USER#${userId}, we just update the attribute
    await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: {
          PK: `USER#${userId}`,
          SK: `METADATA`,
        },
        UpdateExpression: "SET branchId = :branchId, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":branchId": branchId,
          ":updatedAt": Date.now(),
        },
      })
    );

    /* ================= 2. UPDATE COGNITO ================= */
    // 'userId' here must be the Cognito 'Username' (usually the sub UUID)
    await cognito.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: USER_POOL_ID,
        Username: userId, 
        UserAttributes: [
          {
            Name: "custom:branchId", // Verify prefix in Cognito Console
            Value: branchId.toString(),
          },
        ],
      })
    );

    return sendResponse(200, {
      message: "Branch Manager updated successfully",
      userId,
      newBranchId: branchId,
    });
  } catch (err) {
    console.error("Update Error:", err);
    return sendResponse(500, {
      message: "Error updating branch manager",
      error: String(err),
    });
  }
};