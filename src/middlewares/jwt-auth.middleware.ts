import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export const jwtVerify = (jwtSecretKey: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req?.headers?.authorization;
      
      if (!authHeader) {
        res.status(401).json({
          success: false,
          message: 'Authorization header is required',
          data: null,
        });
        return;
      }

      const token = authHeader.split(' ')[1];

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Token must be provided',
          data: null,
        });
        return;
      }

      const payload = jwt.verify(token, jwtSecretKey);

      res.locals.payload = payload;

      next();
    } catch (error: any) {
      console.error('JWT verification error:', error.message);
      res.status(401).json({
        success: false,
        message: error.name === 'TokenExpiredError' 
          ? 'Token has expired' 
          : error.name === 'JsonWebTokenError'
          ? 'Invalid token'
          : 'Token verification failed',
        data: null,
      });
      return;
    }
  };
};

export const roleVerify = (authorizeUser: string[]) => {
 
  return (req: Request, res: Response, next: NextFunction) => {
    const payload = res.locals.payload; 
    if (authorizeUser.includes(payload.role)) {
      next();
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Unauthorized user',
      data: null,
    });
  };
};