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
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";

const ORDERS_TABLE = Resource.Order.name;
const ITEMS_TABLE = Resource.Item.name;
const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const sns = new SNSClient({});

// Get SNS Topic ARN from environment or Resource
const EMAIL_TOPIC_ARN = process.env.EMAIL_TOPIC_ARN || "";

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, ...data }),
});

async function updateRedemption(
  redemptionId: string,
  updates: Record<string, any>
) {
  console.log("🔹 Updating redemption:", redemptionId, updates);

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
  console.log("exprAttrValues", exprAttrValues);
  console.log("exprAttrNames", exprAttrNames);
  console.log("updateExpr", updateExpr);

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
    console.log("redeemable", redeemable);

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
    console.log("redemptionId", redemptionId);

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

async function awardPointsForOrder(
  userId: string,
  orderTotal: number,
  orderId: string
) {
  try {
    // Get points config
    const configResult = await dynamoDb.send(
      new GetCommand({
        TableName: Resource.PointsConfig.name,
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
    console.error("Award points error:", error);
    return null;
  }
}


async function sendOrderReceiptEmail(order: any, userEmail: string, userName: string, branchName?: string) {
  try {
    console.log("📧 Preparing to send email receipt...");

    const emailData = {
      orderId: order.orderId,
      userId: order.userId,
      userEmail,
      userName,
      items: order.items,
      address: order.address,
      paymentMethod: order.paymentMethod,
      orderType: order.orderType,
      specialInstructions: order.specialInstructions,
      scheduledTime: order.scheduledTime,
      branchId: order.branchId,
      branchName,
      subtotal: order.subtotal,
      redemptionDiscount: order.redemptionDiscount,
      freeItemsCount: order.freeItemsCount,
      totalPrice: order.totalPrice,
      status: order.status,
      createdAt: order.createdAt,
    };

    // Publish to SNS topic for async email sending
    if (EMAIL_TOPIC_ARN) {
      await sns.send(
        new PublishCommand({
          TopicArn: EMAIL_TOPIC_ARN,
          Message: JSON.stringify(emailData),
          Subject: `Order Receipt #${order.orderId.substring(0, 8).toUpperCase()}`,
        })
      );
      console.log("✅ Email queued for sending via SNS");
    } else {
      console.warn("⚠️ EMAIL_TOPIC_ARN not configured. Email not sent.");
    }
  } catch (error) {
    // Don't fail the order if email fails
    console.error("❌ Error sending email (non-blocking):", error);
  }
}

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    const userId = event?.requestContext?.authorizer?.lambda?.userId;

    console.log("🔹 User ID:", userId);

    if (!event.body) return sendResponse(400, "Request body missing");
    const body = JSON.parse(event.body);

    const {
      orderId,
      items,
      address,
      paymentMethod,
      orderType,
      specialInstructions,
      scheduledTime,
      branchId,
      subtotal,
      redemptionIds,
      redemptionDiscount,
      freeItemsCount,
    } = body;

    if (!items || !items.length) {
      return sendResponse(400, "No items provided for the order");
    }

    let totalPrice = 0;
    const orderItems: any[] = [];

    // ✅ Validate and normalize items
    for (const i of items) {
      const itemId = i.itemId || i.id || i._id;
      const itemResult = await dynamoDb.send(
        new GetCommand({
          TableName: ITEMS_TABLE,
          Key: { itemId },
        })
      );

      const quantity = i.quantity || 1;
      const fallbackPrice = Number(i.price) || 0;
      const price = itemResult.Item
        ? Number(itemResult.Item.price) || 0
        : fallbackPrice;

      orderItems.push({
        itemId,
        name: i.name,
        quantity,
        price,
        image: i.images?.[0]?.url || null,
      });

      totalPrice += price * quantity;
    }

    // ✅ Adjust total using payload values if provided
    const computedSubtotal = subtotal || totalPrice;
    const discount = Number(redemptionDiscount) || 0;
    const finalTotal = computedSubtotal - discount;

    // const orderId = uuidv4();
    const order = {
      orderId,
      userId: userId || "guest",
      items: orderItems,
      address: address || {},
      paymentMethod: paymentMethod || "cash",
      redemptionIds: redemptionIds || [],
      redemptionDiscount: discount,
      freeItemsCount: freeItemsCount || 0,
      subtotal: computedSubtotal,
      totalPrice: finalTotal,
      orderType: orderType || "dine-in",
      specialInstructions: specialInstructions || "",
      scheduledTime: scheduledTime || null,
      branchId: branchId || null,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // ✅ Process any redemptions
    if (order.redemptionIds?.length) {
      await processRedemptions(order);
    }

    // ✅ Save order in DynamoDB
    await dynamoDb.send(
      new PutCommand({
        TableName: ORDERS_TABLE,
        Item: order,
      })
    );
    // const userId = event?.requestContext?.authorizer?.lambda.userId;

    // console.log("🔹 User ID:", userId);

    // if (!event.body) return sendResponse(400, "Request body missing");
    // const { items, address, paymentMethod, redemptions } = JSON.parse(event.body);

    // if (!items || !items.length) {
    //   return sendResponse(400, "No items provided for the order");
    // }

    // let totalPrice = 0;
    // const orderItems: any[] = [];

    // // ✅ Validate items and calculate total safely
    // for (const i of items) {
    //   const itemId = i.itemId || i.id || i._id;
    //   const itemResult = await dynamoDb.send(
    //     new GetCommand({
    //       TableName: ITEMS_TABLE,
    //       Key: { itemId },
    //     })
    //   );

    //   if (!itemResult.Item) {
    //     console.warn(`Item not found in DB: ${itemId}, using fallback`);
    //     const fallbackItem = {
    //       itemId,
    //       price: Number(i.price) || 0,
    //     };
    //     orderItems.push({
    //       itemId,
    //       quantity: i.quantity || 1,
    //       price: fallbackItem.price,
    //     });
    //     totalPrice += fallbackItem.price * (i.quantity || 1);
    //     continue;
    //   }

    //   const item = itemResult.Item;
    //   const quantity = i.quantity || 1;
    //   const price = Number(item.price) || 0;

    //   totalPrice += price * quantity;
    //   orderItems.push({
    //     itemId: item.itemId,
    //     quantity,
    //     price,
    //   });
    // }

    // const orderId = uuidv4();
    // const order = {
    //   orderId,
    //   userId: userId || "guest",
    //   items: orderItems,
    //   address: address || {},
    //   paymentMethod: paymentMethod || "cash",
    //   redemptions: redemptions || [],
    //   totalPrice,
    //   status: "pending",
    //   createdAt: Date.now(),
    //   updatedAt: Date.now(),
    // };

    //  await processRedemptions(order);

    // await dynamoDb.send(
    //   new PutCommand({ TableName: ORDERS_TABLE, Item: order })
    // );

    // ✅ Award points only if user exists
    if (userId) {
      const pointsResult = await awardPointsForOrder(
        userId,
        finalTotal,
        orderId
      );
      if (pointsResult) {
        console.log(`Awarded ${pointsResult.pointsEarned} points`);
      }
    } else {
      console.log("Guest order - skipping points logic");
    }


    // Get user details for email
    let userEmail = "";
    let userName = "Customer";
    let branchName = "";

    if (userId) {
      const userResult = await dynamoDb.send(
        new GetCommand({
          TableName: Resource.User.name,
          Key: { userId },
        })
      );

      if (userResult.Item) {
        userEmail = userResult.Item.email;
        userName = userResult.Item.name || userResult.Item.firstName || "Customer";
      }
    }

    // Get branch name if available
    if (branchId) {
      try {
        const branchResult = await dynamoDb.send(
          new GetCommand({
            TableName: Resource.Branch.name,
            Key: { branchId },
          })
        );
        if (branchResult.Item) {
          branchName = branchResult.Item.name;
        }
      } catch (error) {
        console.log("Could not fetch branch name:", error);
      }
    }

    // Send email receipt (non-blocking)
    if (userEmail) {
      await sendOrderReceiptEmail(order, userEmail, userName, branchName);
    } else {
      console.log("⚠️ No email address found for user, skipping email receipt");
    }

    return sendResponse(201, "Order created successfully", { order });
  } catch (err) {
    console.error("Error creating order:", err);
    return sendResponse(500, "Error creating order", { error: String(err) });
  }
};

// Export for use in order creation
export { awardPointsForOrder };
