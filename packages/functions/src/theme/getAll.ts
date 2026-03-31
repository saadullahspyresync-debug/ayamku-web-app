import { Resource } from "sst";
import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ScanCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = Resource.ThemeTemplate.name;

export async function main(event: APIGatewayProxyEvent) {
    const params = {
        TableName: TABLE_NAME,
        // Optional: You can add a ProjectionExpression to only get specific fields
        // ProjectionExpression: "templateId, themeName, primaryColor, bannerImg, createdAt"
    };

    try {
        const result = await dynamoDb.send(new ScanCommand(params));

        return {
            statusCode: 200,
            headers: { 
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Templates retrieved successfully",
                data: result.Items // This will be your array of themes
            })
        };
    } catch (err: any) {
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: err.message }) 
        };
    }
}
