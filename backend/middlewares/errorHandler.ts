export {};

const getSafeErrorPayload = (err: any) => {
  const statusCode = err?.statusCode || err?.status || 500;
  let message = err?.message || 'Server Error';

  if (err?.name === 'CastError') {
    return {
      statusCode: 400,
      message: 'Invalid resource identifier'
    };
  }

  if (err?.code === 11000) {
    const keyValue = err.keyValue || {};
    const field = Object.keys(keyValue)[0];
    return {
      statusCode: 409,
      message: field ? `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` : 'Duplicate entry'
    };
  }

  if (err?.name === 'ValidationError') {
    const errorValues = err.errors || {};
    const values = Object.values(errorValues) as any[];
    return {
      statusCode: 422,
      message: values.map((value) => value?.message).filter(Boolean).join(', ') || 'Validation failed'
    };
  }

  if (err?.name === 'JsonWebTokenError') {
    return { statusCode: 401, message: 'Invalid token' };
  }

  if (err?.name === 'TokenExpiredError') {
    return { statusCode: 401, message: 'Token expired' };
  }

  if (err?.code === 'LIMIT_FILE_SIZE') {
    return { statusCode: 400, message: 'File too large' };
  }

  if (err?.code === 'LIMIT_UNEXPECTED_FILE') {
    return { statusCode: 400, message: 'Too many files uploaded' };
  }

  if (statusCode >= 400 && statusCode < 500 && !message) {
    message = 'Request failed';
  }

  if (statusCode === 401) {
    message = 'Authentication required';
  }

  return {
    statusCode,
    message
  };
};

const errorHandler = (err: any, req: any, res: any, next: any) => {
  const payload = getSafeErrorPayload(err);

  if (process.env.NODE_ENV === 'development' && process.env.DEBUG_ERRORS === 'true') {
    console.error('Request error:', {
      name: err?.name,
      code: err?.code,
      message: err?.message,
      statusCode: payload.statusCode
    });
  }

  const response: Record<string, any> = {
    success: false,
    message: payload.message || 'Server Error'
  };

  if (process.env.NODE_ENV === 'development' && process.env.DEBUG_ERRORS === 'true') {
    response.error = err?.name || 'InternalError';
    response.stack = err?.stack;
  }

  res.status(payload.statusCode || 500).json(response);
};

export default errorHandler;
export { getSafeErrorPayload };
