import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = Resource.Promotion.name;
const ITEMS_TABLE = Resource.Item.name;

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

    const allItemIds = promos.flatMap(p => p.items || []);
    const uniqueItemIds = [...new Set(allItemIds)];

    if (uniqueItemIds.length > 0) {
      // Note: If uniqueItemIds.length > 100, you'd need to chunk this request.
      const itemsResult = await dynamoDb.send(new BatchGetCommand({
        RequestItems: {
          [ITEMS_TABLE]: {
            Keys: uniqueItemIds.map(id => ({ itemId: id })),
          }
        }
      }));

      // 3. Create a lookup map of full item objects
      const itemsMap = (itemsResult.Responses?.[ITEMS_TABLE] || []).reduce((acc: any, item: any) => {
        acc[item.itemId] = item;
        return acc;
      }, {});

      // 4. Merge back into promos
      promos = promos.map(promo => {
        // Map the IDs in the promo to their full item details from the map
        const itemDetails = (promo.items || []).map((id: string) => {
          const item = itemsMap[id];
          return item ? {
            itemId: item.itemId,
            name: item.name,
          } : { itemId: id, name: "Unknown Item" };
        });

        return {
          ...promo,
          // Sending back an array of names as you originally wanted
          itemNames: itemDetails.map((i: any) => i.name),
        };
      });
    }

    return sendResponse(200, "Promotions fetched successfully", promos);
  } catch (error) {
    return sendResponse(500, "Error fetching promotions", { error: String(error) });
  }
};
