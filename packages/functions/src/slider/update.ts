import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = Resource.Slider.name
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

export async function main(event: APIGatewayProxyEvent) {
  try {
    const sliderId = event.pathParameters?.id;
    if (!sliderId) return { statusCode: 400, body: JSON.stringify({ message: "Missing sliderId" }) };
    if (!event.body) return { statusCode: 400, body: JSON.stringify({ message: "Missing request body" }) };

    const data = JSON.parse(event.body);
    if (data.fileName) data.image = `${BASE_URL}/uploads/${data.fileName}`;

    let updateExpr = "SET ";
    const exprAttrNames: any = {};
    const exprAttrValues: any = {};
    Object.keys(data).forEach((key, idx, arr) => {
      updateExpr += `#${key} = :${key}${idx < arr.length - 1 ? ", " : ""}`;
      exprAttrNames[`#${key}`] = key;
      exprAttrValues[`:${key}`] = data[key];
    });

    const result = await dynamoDb.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { sliderId },
      UpdateExpression: updateExpr,
      ExpressionAttributeNames: exprAttrNames,
      ExpressionAttributeValues: exprAttrValues,
      ReturnValues: "ALL_NEW",
    }));


    return { statusCode: 200, body: JSON.stringify({ message: "Slider updated successfully", data: result.Attributes }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: (error as Error).message }) };
  }
}
