import { AppError } from '../utils/AppError.js';

export function getValidatedQuery(req) {
  return req.validatedQuery ?? req.query;
}

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const input =
      source === 'body'
        ? req.body
        : source === 'params'
          ? req.params
          : { ...req.query };

    const result = schema.safeParse(input);

    if (!result.success) {
      const message = result.error.errors.map((issue) => issue.message).join(', ');
      return next(new AppError(message, 400, 'VALIDATION_ERROR'));
    }

    if (source === 'body') {
      req.body = result.data;
    } else if (source === 'params') {
      req.params = result.data;
    } else {
      req.validatedQuery = result.data;
    }

    next();
  };
}

export function validateParams(schema) {
  return validate(schema, 'params');
}
