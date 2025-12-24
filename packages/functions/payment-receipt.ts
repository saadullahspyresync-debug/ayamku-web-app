import { APIGatewayProxyHandlerV2 } from "aws-lambda";

export const main: APIGatewayProxyHandlerV2 = async (event) => {
  console.log("CyberSource receipt callback:", event);

  // CyberSource sends form-urlencoded
  const data = event.body ?? "";

  // Normally you'd parse & update DynamoDB here
  console.log("Received Payment Receipt:", data);

  // CyberSource requires an empty 200 OK to confirm
  return {
    statusCode: 200,
    body: "OK",
  };
};
