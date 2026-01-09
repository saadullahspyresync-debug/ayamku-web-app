import { Resource } from "sst";
import { APIGatewayProxyEvent } from "aws-lambda";
import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminUpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const dynamoDb = DynamoDBDocumentClient.from(
  new DynamoDBClient({})
);

const cognito = new CognitoIdentityProviderClient({});

export async function main(event: APIGatewayProxyEvent) {
  try {
    /* =========================
       1. Authorization Check
    ========================= */

    const role = (event.requestContext as any)?.authorizer?.lambda?.userRole;
    if (role !== "Admin") {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    /* =========================
       2. Validate Input
    ========================= */

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Request body is missing" }),
      };
    }

    const { email, branchId } = JSON.parse(event.body);

    if (!email || !branchId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "email and branchId are required",
        }),
      };
    }
    /* =========================
       3. Create Cognito User
    ========================= */

    const createResponse = await cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: Resource.UserPool.id,
        Username: email,
        TemporaryPassword: "TempPass123!",
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
        ],
      })
    );

    const userId = createResponse.User?.Attributes?.find(
      (attr) => attr.Name === "sub"
    )?.Value;

    if(!userId){
      throw new Error("Failed to retrieve user ID from cognito response")
    }

    await cognito.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: Resource.UserPool.id,
        Username: email,
        GroupName: "Branch_Manager",
      })
    );

    await cognito.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: Resource.UserPool.id,
        Username: email,
        UserAttributes: [
          { Name: "custom:branchId", Value: branchId },
        ],
      })
    );

    /* =========================
       4. Save Metadata to DynamoDB
    ========================= */

    const item = {
      PK: `BRANCH#${branchId}`,
      SK: `MANAGER#${email}`,

      userId,
      email,
      status: "ACTIVE",

      branchId,
      createdAt: Date.now(),
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: Resource.BranchManager.name,
        Item: item,
        ConditionExpression:
          "attribute_not_exists(PK) AND attribute_not_exists(SK)",
      })
    );

    /* =========================
       5. Success Response
    ========================= */

    return {
      statusCode: 201,
      body: JSON.stringify({
        status: 201,
        message: "Branch Manager created successfully",
        data: item,
      }),
    };
  } catch (error: any) {
    console.error("Create Branch Manager Error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error:
          error?.message ||
          "Failed to create Branch Manager",
      }),
    };
  }
}
