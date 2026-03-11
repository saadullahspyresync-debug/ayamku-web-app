import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export async function getProductFromDB(itemId: string) {
  try {
    // 🛡️ THE SECURITY SOURCE OF TRUTH
    const command = new GetCommand({
        TableName: Resource.Item.name, 
        Key: { itemId: itemId },
    });

    const result = await docClient.send(command);

    return {
      id: itemId,
      price: result.Item?.price,
      name: result.Item?.name
    };
  } catch (error) {
    throw new Error("Could not verify product price");
  }
}

export async function savePendingOrder(orderData: {
  orderId: string,
  status: string,
  items: any[],
  metadata: any
}) {
    
  const command = new PutCommand({
    TableName: Resource.Order.name,
    Item: {
      orderId: orderData.orderId,
      items: orderData.items,
      status: orderData.status,
      createdAt: Date.now(),
      ...orderData.metadata
    },
  });
  await docClient.send(command);
}

export async function getPendingOrder(orderId: string) {
  try {
    const command = new GetCommand({
      TableName: Resource.Order.name,
      Key: { orderId: orderId },
    });

    const result = await docClient.send(command);
    return result.Item;
  } catch (error) {
    console.error("Error fetching pending order:", error);
    return null;
  }
}