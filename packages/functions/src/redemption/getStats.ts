// packages/functions/src/admin/redemption/getStats.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));


export const main = async (event: any) => {
  try {
    // Fetch all redemptions
    const redemptionsResult = await dynamoDb.send(
      new ScanCommand({
        TableName: Resource.RedemptionHistory.name,
      })
    );

    const redemptions = redemptionsResult.Items || [];

    // Calculate stats
    const totalRedemptions = redemptions.length;
    const totalPointsRedeemed = redemptions.reduce((sum, r) => sum + (r.pointsCost || 0), 0);
    const activeRedemptions = redemptions.filter(r => r.status === "pending" || r.status === "claimed").length;

    // Count by status
    const redemptionsByStatus = {
      pending: redemptions.filter(r => r.status === "pending").length,
      claimed: redemptions.filter(r => r.status === "claimed").length,
      cancelled: redemptions.filter(r => r.status === "cancelled").length,
      expired: redemptions.filter(r => r.status === "expired").length,
    };

    // Top redeemable items
    const itemCounts: { [key: string]: any } = {};
    redemptions.forEach((r) => {
      if (r.redeemableId) {
        if (!itemCounts[r.redeemableId]) {
          itemCounts[r.redeemableId] = {
            redeemableId: r.redeemableId,
            name: r.redeemableName || "Unknown",
            redemptionCount: 0,
            totalPointsSpent: 0,
          };
        }
        itemCounts[r.redeemableId].redemptionCount++;
        itemCounts[r.redeemableId].totalPointsSpent += r.pointsCost || 0;
      }
    });

    const topRedeemableItems = Object.values(itemCounts)
      .sort((a: any, b: any) => b.redemptionCount - a.redemptionCount)
      .slice(0, 10);

    // Recent redemptions (last 10)
    const recentRedemptions = redemptions
      .sort((a, b) => (b.redeemedAt || 0) - (a.redeemedAt || 0))
      .slice(0, 10);

    const stats = {
      totalRedemptions,
      totalPointsRedeemed,
      activeRedemptions,
      redemptionsByStatus,
      topRedeemableItems,
      recentRedemptions,
    };

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: stats,
      }),
    };
  } catch (error) {
    console.error("Get stats error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to fetch redemption statistics",
      }),
    };
  }
};