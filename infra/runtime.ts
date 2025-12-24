// Export plain table names for Lambdas
export const TABLES = {
  Notes: process.env.NOTES_TABLE || "Notes",
  ActivityLog: process.env.ACTIVITY_LOG_TABLE || "ActivityLog",
  Branch: process.env.BRANCH_TABLE || "Branch",
  Category: process.env.CATEGORY_TABLE || "Category",
  Item: process.env.ITEM_TABLE || "Item",
  Log: process.env.LOG_TABLE || "Log",
  Order: process.env.ORDER_TABLE || "Order",
  PasswordResetOtp: process.env.PASSWORD_RESET_OTP_TABLE || "PasswordResetOtp",
  Promotion: process.env.PROMOTION_TABLE || "Promotion",
  Role: process.env.ROLE_TABLE || "Role",
  SeasonalHighlight: process.env.SEASONAL_HIGHLIGHT_TABLE || "SeasonalHighlight",
  Slider: process.env.SLIDER_TABLE || "Slider",
  SystemStats: process.env.SYSTEM_STATS_TABLE || "SystemStats",
  User: process.env.USER_TABLE || "User",
};
