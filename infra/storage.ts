// infra/storage.ts
export const bucket = new sst.aws.Bucket("AyamkuWeb", {
  public: true,
});
export function StorageStack() {
  // S3 bucket

  // DynamoDB tables
  const notesTable = new sst.aws.Dynamo("Notes", {
    fields: {
      userId: "string",
      noteId: "string",
    },
    primaryIndex: { hashKey: "userId", rangeKey: "noteId" },
  });

  const activityLogTable = new sst.aws.Dynamo("ActivityLog", {
    fields: {
      logId: "string",
      userId: "string",
    },
    primaryIndex: { hashKey: "logId" },
    globalIndexes: {
      userIndex: { hashKey: "userId" },
    },
  });

  const promotionTable = new sst.aws.Dynamo("Promotion", {
    fields: {
      promotionId: "string",
      type: "string",
      status: "string",
    },
    primaryIndex: { hashKey: "promotionId" },
    globalIndexes: {
      typeIndex: { hashKey: "type" },
      statusIndex: { hashKey: "status" },
    },
  });

  const branchTable = new sst.aws.Dynamo("Branch", {
    fields: {
      branchId: "string",
      status: "string",
    },
    primaryIndex: { hashKey: "branchId" },
    globalIndexes: {
      statusIndex: { hashKey: "status" },
    },
  });

  const categoryTable = new sst.aws.Dynamo("Category", {
    fields: {
      categoryId: "string",
      status: "string",
    },
    primaryIndex: { hashKey: "categoryId" },
    globalIndexes: {
      statusIndex: { hashKey: "status" },
    },
  });

  const itemTable = new sst.aws.Dynamo("Item", {
    fields: {
      itemId: "string",
      categoryId: "string",
      status: "string",
    },
    primaryIndex: { hashKey: "itemId" },
    globalIndexes: {
      categoryIndex: { hashKey: "categoryId" },
      statusIndex: { hashKey: "status" },
    },
  });

  const logTable = new sst.aws.Dynamo("Log", {
    fields: {
      logId: "string",
      actorId: "string",
    },
    primaryIndex: { hashKey: "logId" },
    globalIndexes: {
      actorIndex: { hashKey: "actorId" },
    },
  });

  const orderTable = new sst.aws.Dynamo("Order", {
    fields: {
      orderId: "string",
      userId: "string",
      status: "string",
    },
    primaryIndex: { hashKey: "orderId" },
    globalIndexes: {
      userIndex: { hashKey: "userId" },
      statusIndex: { hashKey: "status" },
    },
  });

  const sliderTable = new sst.aws.Dynamo("Slider", {
    fields: {
      sliderId: "string",
      status: "string",
      order: "number",
    },
    primaryIndex: { hashKey: "sliderId" },
    globalIndexes: {
      statusIndex: { hashKey: "status", rangeKey: "order" },
    },
  });

  const seasonalHighlightTable = new sst.aws.Dynamo("SeasonalHighlight", {
    fields: {
      highlightId: "string",
      status: "string",
      priority: "number",
    },
    primaryIndex: { hashKey: "highlightId" },
    globalIndexes: {
      statusIndex: { hashKey: "status", rangeKey: "priority" },
    },
  });

  const userTable = new sst.aws.Dynamo("User", {
    fields: {
      userId: "string",
      email: "string",
    },
    primaryIndex: { hashKey: "userId" },
    globalIndexes: {
      emailIndex: { hashKey: "email" },
    },
  });

  // Points Configuration Table - Stores conversion rates and settings
  const pointsConfigTable = new sst.aws.Dynamo("PointsConfig", {
    fields: {
      configId: "string",
      type: "string", // "conversion_rate", "settings"
    },
    primaryIndex: { hashKey: "configId" },
    globalIndexes: {
      typeIndex: { hashKey: "type" },
    },
  });

  // Redeemable Items Table - Items users can redeem with points
  const redeemableItemTable = new sst.aws.Dynamo("RedeemableItem", {
    fields: {
      redeemableId: "string",
      status: "string", // "active", "inactive", "expired"
      branchId: "string", // Optional: specific branch or "all"
      pointsCost: "number",
      expiresAt: "number", // Timestamp
    },
    primaryIndex: { hashKey: "redeemableId" },
    globalIndexes: {
      statusIndex: { hashKey: "status", rangeKey: "pointsCost" },
      branchIndex: { hashKey: "branchId", rangeKey: "status" },
      expirationIndex: { hashKey: "status", rangeKey: "expiresAt" },
    },
  });

  // Points Transaction Table - Track all points earned and spent
  const pointsTransactionTable = new sst.aws.Dynamo("PointsTransaction", {
    fields: {
      transactionId: "string",
      userId: "string",
      type: "string", // "earn", "redeem", "expire", "admin_adjust"
      createdAt: "number", // Timestamp for sorting
      orderId: "string", // Optional: linked order
    },
    primaryIndex: { hashKey: "transactionId" },
    globalIndexes: {
      userIndex: { hashKey: "userId", rangeKey: "createdAt" },
      typeIndex: { hashKey: "type", rangeKey: "createdAt" },
      orderIndex: { hashKey: "orderId" },
    },
  });

  // Redemption History Table - Track when users redeem rewards
  const redemptionHistoryTable = new sst.aws.Dynamo("RedemptionHistory", {
    fields: {
      redemptionId: "string",
      userId: "string",
      redeemableId: "string",
      redeemedAt: "number", // Timestamp
      status: "string", // "pending", "claimed", "cancelled"
    },
    primaryIndex: { hashKey: "redemptionId" },
    globalIndexes: {
      userIndex: { hashKey: "userId", rangeKey: "redeemedAt" },
      redeemableIndex: { hashKey: "redeemableId", rangeKey: "redeemedAt" },
      statusIndex: { hashKey: "status", rangeKey: "redeemedAt" },
    },
  });

  const contactFormTable = new sst.aws.Dynamo("ContactForm", {
    fields: {
      id: "string", // unique id for each submission
      userId: "string", // optional: reference to user if logged in
      email: "string",
      // firstName: "string",
      // lastName: "string",
      // subject: "string",
      // phone: "string",
      // message: "string",
      // submittedAt: "string", // ISO timestamp
    },
    primaryIndex: { hashKey: "id" },
    globalIndexes: {
      userIndex: { hashKey: "userId" }, // query by user
      emailIndex: { hashKey: "email" }, // query by email
    },
  });

  return {
    tables: {
      notes: notesTable,
      activityLog: activityLogTable,
      branch: branchTable,
      category: categoryTable,
      item: itemTable,
      log: logTable,
      order: orderTable,
      user: userTable,
      promotion: promotionTable,
      slider: sliderTable,
      seasonalHighlight: seasonalHighlightTable,
      pointsConfig: pointsConfigTable,
      redeemableItem: redeemableItemTable,
      pointsTransaction: pointsTransactionTable,
      redemptionHistory: redemptionHistoryTable,
      contactForm: contactFormTable,
    },
  };
}
