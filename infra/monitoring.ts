// infra/monitoring.ts - NEW FILE
// Create this file to centralize your CloudWatch configuration

export function MonitoringStack(props: {
  api: ReturnType<typeof import("./api").ApiStack>;
}) {
  const { api } = props;

  // 1. Create CloudWatch Log Groups with retention
  const apiLogGroup = new aws.cloudwatch.LogGroup("ApiLogs", {
    name: `/aws/apigateway/${$app.name}-${$app.stage}`,
    retentionInDays: 7, // Options: 1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1096, 1827, 2192, 2557, 2922, 3288, 3653
  });

  const defaultStage = api.api.nodes.api.name;

  // 2. Enable API Gateway Logging
  const apiStage = new aws.apigatewayv2.Stage("ApiStageWithLogs", {
    apiId: api.api.nodes.api.id,
    name: defaultStage,
    autoDeploy: true,
    accessLogSettings: {
      destinationArn: apiLogGroup.arn,
      format: JSON.stringify({
        requestId: "$context.requestId",
        ip: "$context.identity.sourceIp",
        requestTime: "$context.requestTime",
        httpMethod: "$context.httpMethod",
        routeKey: "$context.routeKey",
        status: "$context.status",
        protocol: "$context.protocol",
        responseLength: "$context.responseLength",
        errorMessage: "$context.error.message",
        errorType: "$context.error.messageString",
        authorizerError: "$context.authorizer.error",
        integrationErrorMessage: "$context.integrationErrorMessage",
      }),
    },
  });

  // 3. Create CloudWatch Dashboard
  const dashboard = new aws.cloudwatch.Dashboard("ApiDashboard", {
    dashboardName: `${$app.name}-${$app.stage}-dashboard`,
    dashboardBody: JSON.stringify({
      widgets: [
        {
          type: "metric",
          properties: {
            metrics: [
              ["AWS/ApiGateway", "Count", { stat: "Sum", label: "Total Requests" }],
              [".", "4XXError", { stat: "Sum", label: "4XX Errors" }],
              [".", "5XXError", { stat: "Sum", label: "5XX Errors" }],
            ],
            period: 300,
            stat: "Sum",
            region: aws.getRegionOutput().name,
            title: "API Gateway Metrics",
            yAxis: { left: { min: 0 } },
          },
        },
        {
          type: "metric",
          properties: {
            metrics: [
              ["AWS/ApiGateway", "Latency", { stat: "Average", label: "Avg Latency" }],
              ["...", { stat: "Maximum", label: "Max Latency" }],
            ],
            period: 300,
            stat: "Average",
            region: aws.getRegionOutput().name,
            title: "API Latency",
            yAxis: { left: { label: "Milliseconds", min: 0 } },
          },
        },
        {
          type: "log",
          properties: {
            query: `SOURCE '${apiLogGroup.name}'\n| fields @timestamp, httpMethod, routeKey, status, @message\n| sort @timestamp desc\n| limit 20`,
            region: aws.getRegionOutput().name,
            title: "Recent API Calls",
          },
        },
      ],
    }),
  });

  // 4. Create CloudWatch Alarms
  const errorAlarm = new aws.cloudwatch.MetricAlarm("ApiErrorAlarm", {
    name: `${$app.name}-${$app.stage}-high-error-rate`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 2,
    metricName: "5XXError",
    namespace: "AWS/ApiGateway",
    period: 300,
    statistic: "Sum",
    threshold: 10,
    alarmDescription: "Alert when API has more than 10 5XX errors in 5 minutes",
    treatMissingData: "notBreaching",
  });

  return {
    apiLogGroup,
    dashboard,
    errorAlarm,
  };
}