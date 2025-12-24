import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = Resource.Promotion.name;

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, data }),
});

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    const query = event.queryStringParameters || {};
    const filterType = query.type;
    const filterStatus = query.status;

    const data = await dynamoDb.send(new ScanCommand({ TableName: TABLE }));
    let promos = data.Items || [];

    if (filterType) promos = promos.filter(p => p.type === filterType);
    if (filterStatus) promos = promos.filter(p => p.status === filterStatus);

    return sendResponse(200, "Promotions fetched successfully", promos);
  } catch (error) {
    return sendResponse(500, "Error fetching promotions", { error: String(error) });
  }
};
