import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  BatchGetCommand,
} from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = Resource.Order.name;

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, data }),
});

// export const main = async (event: any) => {
//   try {
//     const page = parseInt(event.queryStringParameters?.page || "1");
//     const pageSize = parseInt(event.queryStringParameters?.pageSize || "10");

//     const data = await dynamoDb.send(new ScanCommand({ TableName: TABLE }));
//     const orders = data.Items || [];

//     const branchIds = [...new Set(orders.map((o) => o.branchId))];
//     const userIds = [...new Set(orders.map((o) => o.userId))];

//     const branchTable = Resource.Branch.name;
//     const userTable = Resource.User.name;

//     const relatedData = await dynamoDb.send(
//       new BatchGetCommand({
//         RequestItems: {
//           [branchTable]: { Keys: branchIds.map((id) => ({ branchId: id })) },
//           [userTable]: { Keys: userIds.map((id) => ({ userId: id })) },
//         },
//       })
//     );

//     const branches = relatedData.Responses?.[branchTable] || [];
//     const users = relatedData.Responses?.[userTable] || [];

//     const populatedOrders = orders.map((order) => ({
//       ...order,
//       branch: branches.find((b) => b.branchId === order.branchId),
//       user: users.find((u) => u.userId === order.userId),
//     }));

//     return sendResponse(200, "Orders fetched successfully", {
//       orders: populatedOrders,
//     });
//   } catch (error) {
//     console.error("Error fetching orders:", error);
//     return sendResponse(500, "Error fetching orders", { error: String(error) });
//   }
// };

export const main = async (event: any) => {
  try {
    const page = parseInt(event.queryStringParameters?.page || "1");
    const pageSize = parseInt(event.queryStringParameters?.pageSize || "10");
    const statusFilter = event.queryStringParameters?.status;
    const branchIdFilter = event.queryStringParameters?.branchId;

    // Scan all orders (consider using Query if possible for efficiency)
    let orders: any[] = [];
    let ExclusiveStartKey: any = undefined;

    do {
      const data = await dynamoDb.send(
        new ScanCommand({ TableName: TABLE, ExclusiveStartKey })
      );
      orders = orders.concat(data.Items || []);
      ExclusiveStartKey = data.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    // Apply filters
    if (statusFilter) {
      orders = orders.filter((order) => order.status === statusFilter);
    }
    if (branchIdFilter) {
      orders = orders.filter((order) => order.branchId === branchIdFilter);
    }

    // Populate branch/user info
    const branchIds = [...new Set(orders.map((o) => o.branchId))];
    const userIds = [...new Set(orders.map((o) => o.userId))];

    const branchTable = Resource.Branch.name;
    const userTable = Resource.User.name;
    let branches: any[] = [];
    let users: any[] = [];
    if (branchIds.length > 0 || userIds.length > 0) {
      const relatedData = await dynamoDb.send(
        new BatchGetCommand({
          RequestItems: {
            [branchTable]: { Keys: branchIds.map((id) => ({ branchId: id })) },
            [userTable]: { Keys: userIds.map((id) => ({ userId: id })) },
          },
        })
      );
      branches = relatedData.Responses?.[branchTable] || [];
      users = relatedData.Responses?.[userTable] || [];
    }

    const populatedOrders = orders.map((order) => ({
      ...order,
      branch: branches.find((b) => b.branchId === order.branchId),
      user: users.find((u) => u.userId === order.userId),
    }));

    // Pagination
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
    console.error("Error fetching orders:", error);
    return sendResponse(500, "Error fetching orders", { error: String(error) });
  }
};
