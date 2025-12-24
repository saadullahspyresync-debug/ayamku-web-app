import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));


export const main = async (event: any) => {
  try {
    const body = JSON.parse(event.body);
    const { redemptionId, status } = body;

    if (!redemptionId || !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing redemptionId or status" }),
      };
    }

    await dynamoDb.send(
      new UpdateCommand({
        TableName: Resource.RedemptionHistory.name,
        Key: { redemptionId },
        UpdateExpression: "SET #status = :status",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":status": status },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("Error updating redemption status:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
