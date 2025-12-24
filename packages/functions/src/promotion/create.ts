// import { APIGatewayProxyEvent } from "aws-lambda";
// import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
// import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
// import crypto from "crypto";
// import { Resource } from "sst";

// const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
// const TABLE = Resource.Promotion.name;

// const sendResponse = (status: number, message: string, data?: any) => ({
//   statusCode: status,
//   body: JSON.stringify({ message, data }),
// });

// export const main = async (event: APIGatewayProxyEvent, user?: any) => {
//   try {
    
//     if (!event.body) return sendResponse(400, "No body provided");

//     const body = JSON.parse(event.body);
//     const promo = {
//       ...body,
//       promotionId: crypto.randomUUID(),
//       createdAt: Date.now(),
//     };

//     await dynamoDb.send(new PutCommand({
//       TableName: TABLE,
//       Item: promo,
//     }));


//     return sendResponse(201, "Promotion created successfully", promo);
//   } catch (error) {
//     return sendResponse(500, "Error creating promotion", { error: String(error) });
//   }
// };
import * as uuid from "uuid";
import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = Resource.Promotion.name;
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

export async function main(event: APIGatewayProxyEvent) {
  try {
    if (!event.body) throw new Error("Missing request body");
    const data = JSON.parse(event.body);

    // ✅ If image filename exists, generate full URL
    if (data.fileName) {
      data.image = `${BASE_URL}/uploads/${data.fileName}`;
    }

    const item = {
      promotionId: uuid.v4(),
      ...data,
      createdAt: Date.now(),
    };

    // ✅ Save promotion to DynamoDB
    await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Promotion created successfully",
        data: item,
      }),
    };
  } catch (error) {
    console.error("❌ Error creating promotion:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: (error as Error).message,
      }),
    };
  }
}
