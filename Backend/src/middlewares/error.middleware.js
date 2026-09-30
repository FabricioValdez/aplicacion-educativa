export function errorHandler(error, _request, response, _next) {
  console.error("Unhandled error:", error);
  const status = error.status || 500;
  return response.status(status).json({
    message: error.message || "Error interno del servidor.",
    ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
  });
}
