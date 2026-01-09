import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = Resource.BranchManager.name;

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
    const email = event.pathParameters?.email;
    if (!email) {
      return sendResponse(400, { message: "Email is required" });
    }

    /* ================= BODY ================= */
    if (!event.body) {
      return sendResponse(400, { message: "Request body missing" });
    }

    const { status } = JSON.parse(event.body);

    if (!["ACTIVE", "DISABLED"].includes(status)) {
      return sendResponse(400, {
        message: "Invalid status. Use ACTIVE or DISABLED",
      });
    }

    /* ================= FIND MANAGER BY EMAIL ================= */
    const queryResult = await dynamoDb.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: "managerIndex", // 👈 GSI
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": email,
        },
      })
    );

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return sendResponse(404, { message: "Branch manager not found" });
    }

    const manager = queryResult.Items[0];

    /* ================= UPDATE STATUS ================= */
    await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: {
          PK: manager.PK,
          SK: manager.SK,
        },
        UpdateExpression: "SET #status = :status",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": status,
        },
      })
    );

    return sendResponse(200, {
      message: "Branch manager disabled successfully",
      email,
    });
  } catch (err) {
    console.error("Disable Branch Manager Error:", err);
    return sendResponse(500, {
      message: "Error disabling branch manager",
      error: String(err),
    });
  }
};
