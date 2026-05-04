import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  BatchGetCommand,
  QueryCommand
} from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = Resource.Order.name;

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, data }),
});

export const main = async (event: any) => {
  try {
    /* ================= AUTH ================= */
    const auth = event.requestContext.authorizer?.lambda;
    if (!auth) {
      return sendResponse(401, "Unauthorized");
    }

    const userId = auth.userId;    

    let role: "Admin" | "Branch_Manager" | null = null;
    if (auth.userRole.includes("Admin")) role = "Admin";
    else if (auth.userRole.includes("Branch_Manager")) role = "Branch_Manager";

    if (!role) {
      return sendResponse(403, "Access denied");
    }

    /* ================= QUERY PARAMS ================= */
    const page = parseInt(event.queryStringParameters?.page || "1");
    const pageSize = parseInt(event.queryStringParameters?.pageSize || "10");
    const statusFilter = event.queryStringParameters?.status;
    const branchIdFilter = event.queryStringParameters?.branchId;
    const orderIdFilter = event.queryStringParameters?.orderId;

    /* ================= BRANCH RESTRICTION ================= */
    let enforcedBranchId: string | null = null;

    if (role === "Branch_Manager") {
      // 🔒 get assigned branchId
      const bm = await dynamoDb.send(
        new QueryCommand({
          TableName: Resource.BranchManager.name,
          IndexName: "userIndex", // 👈 GSI
          KeyConditionExpression: "userId = :uid",
          ExpressionAttributeValues: {
            ":uid": userId,
          },
          Limit: 1,
        })
      );

      const item = bm.Items?.[0];
      enforcedBranchId = item?.branchId;

      if (!enforcedBranchId) {
        return sendResponse(403, "Branch not assigned");
      }
    }

    /* ================= FETCH ORDERS ================= */
    let orders: any[] = [];
    // let ExclusiveStartKey: any = undefined;

    // do {
    //   const data = await dynamoDb.send(
    //     new ScanCommand({ TableName: TABLE, ExclusiveStartKey })
    //   );
    //   orders = orders.concat(data.Items || []);
    //   ExclusiveStartKey = data.LastEvaluatedKey;
    // } while (ExclusiveStartKey);
    const data = await dynamoDb.send(
        new ScanCommand({ TableName: TABLE, })
      );
    orders = orders.concat(data.Items || []);

    /* ================= FILTERING ================= */
    if (statusFilter) {
      orders = orders.filter((o) => o.status === statusFilter);
    }

    if (branchIdFilter) {
      orders = orders.filter((order) => order.branchId === branchIdFilter);
    }

    if(orderIdFilter){
      orders = orders.filter((o) => o.orderId.toLowerCase().includes(orderIdFilter.toLowerCase()));
    }

    // 🔒 Enforced branch filter
    if (role === "Branch_Manager") {
      orders = orders.filter((o) => o.branchId === enforcedBranchId);
    }

    /* ================= POPULATE BRANCH + USER ================= */
    const branchIds = [...new Set(orders.map((o) => o.branchId))];
    const userIds = [...new Set(orders.map((o) => o.userId))];

    let branches: any[] = [];
    let users: any[] = [];

    if (branchIds.length || userIds.length) {
      const relatedData = await dynamoDb.send(
        new BatchGetCommand({
          RequestItems: {
            [Resource.Branch.name]: {
              Keys: branchIds.map((id) => ({ branchId: id })),
            },
            [Resource.User.name]: {
              Keys: userIds.map((id) => ({ userId: id })),
            },
          },
        })
      );

      branches = relatedData.Responses?.[Resource.Branch.name] || [];
      users = relatedData.Responses?.[Resource.User.name] || [];
    }

    const populatedOrders = orders.map((order) => ({
      ...order,
      branch: branches.find((b) => b.branchId === order.branchId),
      user: users.find((u) => u.userId === order.userId),
    }));

    /* ================= PAGINATION ================= */
    const startIndex = (page - 1) * pageSize;
    const paginatedOrders = populatedOrders.slice(
      startIndex,
      startIndex + pageSize
    );

    return sendResponse(200, "Orders fetched successfully", {
      orders: paginatedOrders,
      total: populatedOrders.length,
    });
  } catch (error) {
    return sendResponse(500, "Error fetching orders", { error: String(error) });
  }
};
