import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { Resource } from "sst";
import { sendOrderConfirmation } from "../email/emailService";

const ORDERS_TABLE = Resource.Order.name;
const POINTS_CONFIG_TABLE = Resource.PointsConfig.name;
const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, ...data }),
});

async function updateRedemption(
  redemptionId: string,
  updates: Record<string, any>
) {
  const updateExpr = Object.keys(updates)
    .map((key) => `#${key} = :${key}`)
    .join(", ");

  const exprAttrNames = Object.keys(updates).reduce((acc, key) => {
    acc[`#${key}`] = key;
    return acc;
  }, {} as Record<string, string>);

  const exprAttrValues = Object.keys(updates).reduce((acc, key) => {
    acc[`:${key}`] = updates[key];
    return acc;
  }, {} as Record<string, any>);

  await dynamoDb.send(
    new UpdateCommand({
      TableName: Resource.RedemptionHistory.name,
      Key: { redemptionId },
      UpdateExpression: `SET ${updateExpr}`,
      ExpressionAttributeNames: exprAttrNames,
      ExpressionAttributeValues: exprAttrValues,
    })
  );
}

async function processRedemptions(order: any) {
  const { redemptionIds: redemptions } = order; // expected array of redemptionIds

  if (!redemptions || !redemptions.length) return;

  for (const redemptionId of redemptions) {
    // 1️⃣ Fetch redemption record
    const redemptionResult = await dynamoDb.send(
      new GetCommand({
        TableName: Resource.RedemptionHistory.name,
        Key: { redemptionId },
      })
    );

    const redemption = redemptionResult.Item;
    if (!redemption || redemption.status !== "pending") continue;

    // 2️⃣ Fetch the redeemable item
    const redeemableResult = await dynamoDb.send(
      new GetCommand({
        TableName: Resource.RedeemableItem.name,
        Key: { redeemableId: redemption.redeemableId },
      })
    );

    const redeemable = redeemableResult.Item;
    if (!redeemable || redeemable.status !== "active") continue;

    // 3️⃣ Update RedeemableItem stock
    await dynamoDb.send(
      new UpdateCommand({
        TableName: Resource.RedeemableItem.name,
        Key: { redeemableId: redemption.redeemableId },
        UpdateExpression:
          "SET availableQuantity = availableQuantity - :dec, redeemedCount = redeemedCount + :inc, updatedAt = :now",
        ExpressionAttributeValues: {
          ":dec": 1,
          ":inc": 1,
          ":now": Date.now(),
        },
      })
    );

    // 4️⃣ Mark redemption as applied
    await updateRedemption(redemptionId, {
      status: "applied",
      appliedToOrderId: order.orderId,
      appliedAt: Date.now(),
    });

    // 5️⃣ Add free item to order (if applicable)
    order.items.push({
      itemId: redemption.redeemableId,
      name: redeemable.name,
      price: 0,
      quantity: 1,
      isRedeemed: true,
      redemptionId,
    });
  }
}

// packages/functions/src/order/create.ts - Add points earning logic
// Add this to your existing order creation handler

export async function awardPointsForOrder(
  userId: string,
  orderTotal: number,
  orderId: string
) {
  try {
    // Get points config
    const configResult = await dynamoDb.send(
      new GetCommand({
        TableName: POINTS_CONFIG_TABLE,
        Key: { configId: "default" },
      })
    );

    const config = configResult.Item || { conversionRate: 10, enabled: true };

    if (!config.enabled) {
      return null; // Points system disabled
    }

    // Calculate points earned
    const pointsEarned = Math.floor(orderTotal * config.conversionRate);

    // Get user
    const userResult = await dynamoDb.send(
      new GetCommand({
        TableName: Resource.User.name,
        Key: { userId },
      })
    );

    if (!userResult.Item) {
      throw new Error("User not found");
    }

    const currentPoints = userResult.Item.points || 0;
    const newBalance = currentPoints + pointsEarned;

    // Update user points
    await dynamoDb.send(
      new PutCommand({
        TableName: Resource.User.name,
        Item: {
          ...userResult.Item,
          points: newBalance,
          updatedAt: Date.now(),
        },
      })
    );

    // Create transaction record
    const transaction = {
      transactionId: uuidv4(),
      userId,
      userName: userResult.Item.name,
      userEmail: userResult.Item.email,
      type: "earn",
      points: pointsEarned,
      balanceAfter: newBalance,
      description: `Earned from Order #${orderId}`,
      orderId,
      metadata: {
        orderTotal,
      },
      createdAt: Date.now(),
      expiresAt:
        config.pointsExpiryDays > 0
          ? Date.now() + config.pointsExpiryDays * 24 * 60 * 60 * 1000
          : undefined,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: Resource.PointsTransaction.name,
        Item: transaction,
      })
    );

    return {
      pointsEarned,
      newBalance,
    };
  } catch (error) {
    return null;
  }
}

export async function finalizeAndProcessOrder(orderId: string, transactionId: string) {
  // 1. Fetch the PENDING order we saved during checkout
  const result = await dynamoDb.send(new GetCommand({
    TableName: ORDERS_TABLE,
    Key: { orderId }
  }));
  const order = result.Item;

  if (!order) throw new Error("Order not found");
  if (order.status === "completed") return order; // Already processed

  // 2. Run your existing business logic
  if (order.redemptionIds?.length) {
    await processRedemptions(order);
  }

  if (order.userId) {
    await awardPointsForOrder(order.userId, order.totalPrice, orderId);
  }

  // 3. Update status to 'completed'
  await dynamoDb.send(new UpdateCommand({
    TableName: ORDERS_TABLE,
    Key: { orderId },
    UpdateExpression: "SET #status = :s, transactionId = :t, updatedAt = :u",
    ExpressionAttributeNames: { "#status": "status" },
    ExpressionAttributeValues: {
      ":s": "completed",
      ":t": transactionId,
      ":u": Date.now()
    }
  }));

  // update status for sending customer
  order.status = "completed";

  // 4. Send Email (Fetch user details first like you did in main)
  try {
    const email = order?.email;
    if (email) {
      await sendOrderConfirmation(email, order);
    }
  } catch (emailError) {
    throw new Error("Order completed but failed to send email.");
  }
  return order;
}
