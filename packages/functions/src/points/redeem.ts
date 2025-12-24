// // packages/functions/src/points/redeem.ts - Backend handler
// import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
// import {
//   DynamoDBDocumentClient,
//   GetCommand,
//   PutCommand,
//   UpdateCommand,
// } from "@aws-sdk/lib-dynamodb";
// import { Resource } from "sst";
// import { ulid } from "ulid";

// const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// export const main = async (event: any) => {
//   try {
//     const body = JSON.parse(event.body);
//     const userId = event.requestContext?.authorizer?.lambda?.userId;
//     const { redeemableId } = body;

//     if (!redeemableId) {
//       return {
//         statusCode: 400,
//         body: JSON.stringify({
//           success: false,
//           message: "redeemableId is required",
//         }),
//       };
//     }

//     // Get redeemable item
//     const redeemableResult = await dynamoDb.send(
//       new GetCommand({
//         TableName: Resource.RedeemableItem.name,
//         Key: { redeemableId },
//       })
//     );

//     const redeemable = redeemableResult.Item;

//     if (!redeemable) {
//       return {
//         statusCode: 404,
//         body: JSON.stringify({
//           success: false,
//           message: "Redeemable item not found",
//         }),
//       };
//     }

//     if (redeemable.status !== "active") {
//       return {
//         statusCode: 400,
//         body: JSON.stringify({
//           success: false,
//           message: "This item is not available for redemption",
//         }),
//       };
//     }

//     // Check expiry
//     if (redeemable.expiresAt && redeemable.expiresAt < Date.now()) {
//       return {
//         statusCode: 400,
//         body: JSON.stringify({
//           success: false,
//           message: "This item has expired",
//         }),
//       };
//     }

//     // Check quantity
//     if (
//       redeemable.availableQuantity !== undefined &&
//       redeemable.availableQuantity <= 0
//     ) {
//       return {
//         statusCode: 400,
//         body: JSON.stringify({
//           success: false,
//           message: "This item is out of stock",
//         }),
//       };
//     }

//     // Get user
//     const userResult = await dynamoDb.send(
//       new GetCommand({
//         TableName: Resource.User.name,
//         Key: { userId },
//       })
//     );

//     const user = userResult.Item;

//     if (!user) {
//       return {
//         statusCode: 404,
//         body: JSON.stringify({
//           success: false,
//           message: "User not found",
//         }),
//       };
//     }

//     const currentPoints = user.points || 0;

//     // Get points config
//     const configResult = await dynamoDb.send(
//       new GetCommand({
//         TableName: Resource.PointsConfig.name,
//         Key: { configId: "default" },
//       })
//     );

//     const pointsConfig = configResult.Item;

//     const minRedemptionPoints = pointsConfig?.minRedemptionPoints || 100; // fallback to 400

//     if (currentPoints < minRedemptionPoints) {
//       return {
//         statusCode: 400,
//         body: JSON.stringify({
//           success: false,
//           message: `You need at least ${minRedemptionPoints} points to redeem rewards. You currently have ${currentPoints} points.`,
//         }),
//       };
//     }

//     // Check if user has enough points
//     if (currentPoints < redeemable.pointsCost) {
//       return {
//         statusCode: 400,
//         body: JSON.stringify({
//           success: false,
//           message: `Insufficient points. You have ${currentPoints} points but need ${redeemable.pointsCost}`,
//         }),
//       };
//     }

//     // Deduct points from user
//     const newBalance = currentPoints - redeemable.pointsCost;

//     await dynamoDb.send(
//       new PutCommand({
//         TableName: Resource.User.name,
//         Item: {
//           ...user,
//           points: newBalance,
//           updatedAt: Date.now(),
//         },
//       })
//     );

//     // Create redemption record
//     const redemptionId = ulid();
//     const now = Date.now();
//     const redemption = {
//       redemptionId,
//       userId,
//       userName: user.name,
//       userEmail: user.email,
//       redeemableId,
//       redeemableName: redeemable.name,
//       pointsCost: redeemable.pointsCost,
//       status: "pending",
//       branchId: redeemable.branchId,
//       redeemedAt: now,
//       expiresAt: now + 30 * 24 * 60 * 60 * 1000, // 30 days to claim
//     };

//     await dynamoDb.send(
//       new PutCommand({
//         TableName: Resource.RedemptionHistory.name,
//         Item: redemption,
//       })
//     );

//     // Create transaction record
//     const transaction = {
//       transactionId: ulid(),
//       userId,
//       userName: user.name,
//       userEmail: user.email,
//       type: "redeem",
//       points: -redeemable.pointsCost,
//       balanceAfter: newBalance,
//       description: `Redeemed ${redeemable.name}`,
//       redeemableId,
//       redemptionId,
//       createdAt: now,
//     };

//     await dynamoDb.send(
//       new PutCommand({
//         TableName: Resource.PointsTransaction.name,
//         Item: transaction,
//       })
//     );

//     // Update redeemable item stats
//     await dynamoDb.send(
//       new UpdateCommand({
//         TableName: Resource.RedeemableItem.name,
//         Key: { redeemableId },
//         UpdateExpression: `
//       SET 
//         redeemedCount = if_not_exists(redeemedCount, :zero) + :inc,
//         availableQuantity = if_not_exists(availableQuantity, :zero) - :dec
//     `,
//         ExpressionAttributeValues: {
//           ":zero": 0,
//           ":inc": 1,
//           ":dec": 1,
//         },
//         ReturnValues: "UPDATED_NEW",
//       })
//     );

//     return {
//       statusCode: 200,
//       body: JSON.stringify({
//         success: true,
//         data: {
//           userId,
//           totalPoints: newBalance,
//           transactions: [transaction],
//           redemptions: [redemption],
//         },
//       }),
//     };
//   } catch (error) {
//     console.error("Get balance error:", error);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({
//         success: false,
//         message: "Failed to fetch points balance",
//       }),
//     };
//   }
// };

// packages/functions/src/points/redeem.ts - Backend handler
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";
import { ulid } from "ulid";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const main = async (event: any) => {
  console.log("Event received:", JSON.stringify(event, null, 2));
  
  try {
    // ✅ Validate environment
    console.log("Resource check:", {
      redeemableTable: Resource.RedeemableItem?.name,
      userTable: Resource.User?.name,
      configTable: Resource.PointsConfig?.name,
      redemptionTable: Resource.RedemptionHistory?.name,
      transactionTable: Resource.PointsTransaction?.name,
    });

    const body = JSON.parse(event.body);
    console.log("Parsed body:", body);
    
    const userId = event.requestContext?.authorizer?.lambda?.userId;
    console.log("User ID from authorizer:", userId);
    
    const { redeemableId } = body;

    // ✅ Check if userId exists
    if (!userId) {
      console.error("No userId found in authorizer");
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          message: "Unauthorized: User ID not found",
        }),
      };
    }

    if (!redeemableId) {
      console.error("No redeemableId provided");
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "redeemableId is required",
        }),
      };
    }

    console.log("Fetching redeemable item:", redeemableId);
    
    // Get redeemable item
    const redeemableResult = await dynamoDb.send(
      new GetCommand({
        TableName: Resource.RedeemableItem.name,
        Key: { redeemableId },
      })
    );

    console.log("Redeemable result:", redeemableResult);

    const redeemable = redeemableResult.Item;

    if (!redeemable) {
      console.error("Redeemable not found:", redeemableId);
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          message: "Redeemable item not found",
        }),
      };
    }

    if (redeemable.status !== "active") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "This item is not available for redemption",
        }),
      };
    }

    // Check expiry
    if (redeemable.expiresAt && redeemable.expiresAt < Date.now()) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "This item has expired",
        }),
      };
    }

    // Check quantity
    if (
      redeemable.availableQuantity !== undefined &&
      redeemable.availableQuantity <= 0
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "This item is out of stock",
        }),
      };
    }

    console.log("Fetching user:", userId);

    // Get user
    const userResult = await dynamoDb.send(
      new GetCommand({
        TableName: Resource.User.name,
        Key: { userId },
      })
    );

    console.log("User result:", userResult);

    const user = userResult.Item;

    if (!user) {
      console.error("User not found:", userId);
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          message: "User not found",
        }),
      };
    }

    const currentPoints = user.points || 0;
    console.log("User current points:", currentPoints);

    // ✅ Get points config with better error handling
    let minRedemptionPoints = 100; // default fallback

    try {
      console.log("Fetching points config");
      const configResult = await dynamoDb.send(
        new GetCommand({
          TableName: Resource.PointsConfig.name,
          Key: { configId: "default" },
        })
      );

      const pointsConfig = configResult.Item;
      console.log("Points config:", pointsConfig);

      if (pointsConfig?.minRedemptionPoints) {
        minRedemptionPoints = pointsConfig.minRedemptionPoints;
      }
    } catch (configError) {
      console.warn("Failed to fetch points config, using default:", configError);
      // Continue with default value
    }

    console.log("Minimum redemption points:", minRedemptionPoints);

    if (currentPoints < minRedemptionPoints) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: `You need at least ${minRedemptionPoints} points to redeem rewards. You currently have ${currentPoints} points.`,
        }),
      };
    }

    // Check if user has enough points
    if (currentPoints < redeemable.pointsCost) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: `Insufficient points. You have ${currentPoints} points but need ${redeemable.pointsCost}`,
        }),
      };
    }

    console.log("Processing redemption...");

    // Deduct points from user
    const newBalance = currentPoints - redeemable.pointsCost;

    await dynamoDb.send(
      new PutCommand({
        TableName: Resource.User.name,
        Item: {
          ...user,
          points: newBalance,
          updatedAt: Date.now(),
        },
      })
    );

    console.log("User points updated to:", newBalance);

    // Create redemption record
    const redemptionId = ulid();
    const now = Date.now();
    const redemption = {
      redemptionId,
      userId,
      userName: user.name,
      userEmail: user.email,
      redeemableId,
      redeemableName: redeemable.name,
      pointsCost: redeemable.pointsCost,
      status: "pending",
      branchId: redeemable.branchId,
      redeemedAt: now,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000, // 30 days to claim
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: Resource.RedemptionHistory.name,
        Item: redemption,
      })
    );

    console.log("Redemption record created:", redemptionId);

    // Create transaction record
    const transaction = {
      transactionId: ulid(),
      userId,
      userName: user.name,
      userEmail: user.email,
      type: "redeem",
      points: -redeemable.pointsCost,
      balanceAfter: newBalance,
      description: `Redeemed ${redeemable.name}`,
      redeemableId,
      redemptionId,
      createdAt: now,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: Resource.PointsTransaction.name,
        Item: transaction,
      })
    );

    console.log("Transaction record created");

    // Update redeemable item stats
    await dynamoDb.send(
      new UpdateCommand({
        TableName: Resource.RedeemableItem.name,
        Key: { redeemableId },
        UpdateExpression: `
          SET 
            redeemedCount = if_not_exists(redeemedCount, :zero) + :inc,
            availableQuantity = if_not_exists(availableQuantity, :zero) - :dec
        `,
        ExpressionAttributeValues: {
          ":zero": 0,
          ":inc": 1,
          ":dec": 1,
        },
        ReturnValues: "UPDATED_NEW",
      })
    );

    console.log("Redeemable stats updated");
    console.log("Redemption successful!");

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          userId,
          totalPoints: newBalance,
          transactions: [transaction],
          redemptions: [redemption],
        },
      }),
    };
  } catch (error: any) {
    // ✅ Enhanced error logging
    console.error("=== REDEMPTION ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error:", JSON.stringify(error, null, 2));
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to process redemption",
        error: error.message,
        errorType: error.name,
      }),
    };
  }
};
