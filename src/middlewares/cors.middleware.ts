import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { corsOptions } from '../config/cors.config';
import { NEXTAUTH_INTERNAL_SECRET } from '../config/main.config';

export const customCors = (req: Request, res: Response, next: NextFunction) => {

    if (req?.headers['x-internal-auth'] === NEXTAUTH_INTERNAL_SECRET) {
        return next();
      } else {
        return cors(corsOptions)(req, res, next);
      }

}