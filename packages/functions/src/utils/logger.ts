// packages/functions/src/utils/logger.ts - NEW FILE
// Create this utility for structured logging

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  requestId?: string;
  userId?: string;
  [key: string]: any;
}

class Logger {
  private level: LogLevel;
  private context: LogContext;

  constructor() {
    this.level = (process.env.LOG_LEVEL as LogLevel) || "info";
    this.context = {};
  }

  setContext(context: LogContext) {
    this.context = { ...this.context, ...context };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatLog(level: LogLevel, message: string, meta?: any) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...(meta && { meta }),
    });
  }

  debug(message: string, meta?: any) {
    if (this.shouldLog("debug")) {
      console.log(this.formatLog("debug", message, meta));
    }
  }

  info(message: string, meta?: any) {
    if (this.shouldLog("info")) {
      console.log(this.formatLog("info", message, meta));
    }
  }

  warn(message: string, meta?: any) {
    if (this.shouldLog("warn")) {
      console.warn(this.formatLog("warn", message, meta));
    }
  }

  error(message: string, error?: Error | any) {
    if (this.shouldLog("error")) {
      console.error(
        this.formatLog("error", message, {
          error: error?.message || error,
          stack: error?.stack,
        })
      );
    }
  }
}

// Export a singleton instance
export const logger = new Logger();

// Example usage in your Lambda handlers:
/*
import { logger } from "./utils/logger";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

export async function main(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  // Set request context
  logger.setContext({
    requestId: event.requestContext.requestId,
    path: event.rawPath,
    method: event.requestContext.http.method,
  });

  logger.info("Request received", {
    body: event.body,
    queryParams: event.queryStringParameters,
  });

  try {
    // Your logic here
    const result = await someOperation();
    
    logger.info("Request processed successfully", { result });
    
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    logger.error("Request failed", error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
}
*/