const sendResponse = (status: number, message: string, data?: any) => ({
  statusCode: status,
  body: JSON.stringify({ message, data }),
});

export const main = async () => {
  try {
    const mongoStatus = "N/A (DynamoDB used)";

    return sendResponse(200, "System health check successful", {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      mongoStatus,
      timestamp: new Date(),
    });
  } catch (error) {
    return sendResponse(500, "Error checking system health", { error: String(error) });
  }
};
