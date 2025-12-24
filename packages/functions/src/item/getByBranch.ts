import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, data }),
});

export const main = async (event: APIGatewayProxyEvent) => {
  try {
    const { branchId } = event.pathParameters || {};
    if (!branchId) return sendResponse(400, "branchId is required");

    const data = await dynamoDb.send(
      new ScanCommand({
        TableName: Resource.Item.name,
        FilterExpression: "contains(availableBranches, :branchId)",
        ExpressionAttributeValues: { ":branchId": branchId },
      })
    );

    const items = data.Items || [];

    // Build category ID map with counts
    const categoryCountMap = new Map<string, number>();
    for (const item of items) {
      const categoryId = item.categoryId;
      if (categoryId) {
        categoryCountMap.set(
          categoryId,
          (categoryCountMap.get(categoryId) || 0) + 1
        );
      }
    }

    // Fetch category details from Category table
    const categoryIds = Array.from(categoryCountMap.keys());
    let categories : any = [];

    if (categoryIds.length > 0) {
      // Batch get categories (max 100 at a time)
      const keys = categoryIds.map(id => ({ categoryId: id }));
      
      const batchGetParams = {
        RequestItems: {
          [Resource.Category.name]: {
            Keys: keys
          }
        }
      };

      const categoryData = await dynamoDb.send(new BatchGetCommand(batchGetParams));
      const fetchedCategories = categoryData.Responses?.[Resource.Category.name] || [];

      // Merge category data with item counts
      categories = fetchedCategories.map(category => ({
        _id: category.categoryId,
        name: category.name || null,
        image: category.image || null,
        totalItems: categoryCountMap.get(category.categoryId) || 0,
      }));
    }


    return sendResponse(
      200,
      "Branch items and categories fetched successfully",
      {
        items,
        categories,
        totalItems: items.length,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return sendResponse(500, "Error fetching items by branch", {
      error: String(error),
    });
  }
};