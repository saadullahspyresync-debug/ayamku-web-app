import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = Resource.SeasonalHighlight.name;

export async function main(event: APIGatewayProxyEvent) {
  try {
     // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression:
          "#status = :active AND #startDate <= :now AND #endDate >= :now",
        ExpressionAttributeNames: {
          "#status": "status",
          "#startDate": "startDate",
          "#endDate": "endDate",
        },
        ExpressionAttributeValues: { ":active": "active",  ":now": today },
      })
    );

    const items = result.Items || [];

    return { statusCode: 200, body: JSON.stringify({ data: items }) };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
}
