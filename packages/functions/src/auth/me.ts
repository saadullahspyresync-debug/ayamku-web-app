export const main = async (event: any) => {
  const auth = event.requestContext.authorizer?.lambda;

  // This will only run if authorizer PASSES
  return {
    statusCode: 200,
    body: JSON.stringify({
      userId: auth.userId,
      role: auth.userRole,
    }),
  };
};
