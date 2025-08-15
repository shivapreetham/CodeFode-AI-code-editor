// Standardized API response helpers

export const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  
  return res.status(statusCode).json(response);
};

export const errorResponse = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  };
  
  return res.status(statusCode).json(response);
};

export const validationErrorResponse = (res, errors) => {
  return errorResponse(res, 'Validation failed', 400, errors);
};

export const notFoundResponse = (res, resource = 'Resource') => {
  return errorResponse(res, `${resource} not found`, 404);
};

export const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  return errorResponse(res, message, 401);
};

export const forbiddenResponse = (res, message = 'Access forbidden') => {
  return errorResponse(res, message, 403);
};

export const conflictResponse = (res, message = 'Resource already exists') => {
  return errorResponse(res, message, 409);
};

export const tooManyRequestsResponse = (res, message = 'Too many requests') => {
  return errorResponse(res, message, 429);
};

// Pagination helper
export const paginatedResponse = (res, data, pagination, message = 'Success') => {
  const response = {
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrev: pagination.page > 1
    },
    timestamp: new Date().toISOString()
  };
  
  return res.status(200).json(response);
};