// import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
// import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
// import { Resource } from "sst";

// const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
// const TABLE = Resource.SeasonalHighlight.name;

// const sendResponse = (status: number, message: string, data?: any) => ({
//   statusCode: status,
//   body: JSON.stringify({ message, data }),
// });

// export const main = async () => {
//   try {
//     const now = new Date().toISOString();

//     // 1. Scan for expired seasional highlight
//     const scanResult = await dynamoDb.send(
//       new ScanCommand({
//         TableName: TABLE,
//         FilterExpression: "endDate < :now",
//         ExpressionAttributeValues: {
//           ":now": now,
//         },
//       })
//     );

//     const expiredSeasonalHighlight = scanResult.Items || [];
//     if (expiredSeasonalHighlight.length === 0) {
//       return sendResponse(200, "No expired seasonal highlights found");
//     }

//     // 2. Delete each expired seasional highlights
//     for (const highlight of expiredSeasonalHighlight) {
//       await dynamoDb.send(
//         new DeleteCommand({
//           TableName: TABLE,
//           Key: { highlightId : highlight.highlightId  },
//         })
//       );
//     }

//     return sendResponse(200, "Expired seasonal highlights deleted", { deleted: expiredSeasonalHighlight.length });
//   } catch (error) {
//     return sendResponse(500, "Error auto-deleting expired seasonal highlights", {
//       error: String(error),
//     });
//   }
// };
