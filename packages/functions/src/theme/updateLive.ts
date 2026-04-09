import { Resource } from "sst";
import { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
// This targets your "Singleton" table for live settings
const TABLE_NAME = Resource.AppSettings.name;

export async function main(event: APIGatewayProxyEvent) {
    try {
        const { templateId, themeName, primaryColor, bannerImg } = JSON.parse(event?.body!);

        // Validation: Ensure we aren't saving empty data to the live site
        if (!templateId || !primaryColor || !bannerImg) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing required theme data" })
            };
        }

        const params = {
            TableName: TABLE_NAME,
            Item: {
                id: "ACTIVE_THEME", // The fixed key the website always looks for
                templateId: templateId,
                themeName: themeName,
                primaryColor: primaryColor,
                bannerImg: bannerImg,
                publishedAt: new Date().toISOString(),
                publishedBy: "Admin" // Optional: for tracking
            }
        };

        await dynamoDb.send(new PutCommand(params));

        return {
            statusCode: 200,
            headers: { 
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ 
                message: `Successfully published ${themeName} to the live website!` 
            })
        };
    } catch (err: any) {
        console.error("Update Live Error:", err);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: err.message }) 
        };
    }
}
