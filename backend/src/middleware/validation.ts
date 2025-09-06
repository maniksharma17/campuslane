import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      const message = error.errors?.map((err: any) => err.message).join(', ') || 'Validation failed';
      next(new ValidationError(message));
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error: any) {
      const message = error.errors?.map((err: any) => err.message).join(', ') || 'Validation failed';
      next(new ValidationError(message));
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated;
      next();
    } catch (error: any) {
      const message = error.errors?.map((err: any) => err.message).join(', ') || 'Validation failed';
      next(new ValidationError(message));
    }
  };
};