import { CORS_WHITELIST_URL_1, CORS_WHITELIST_URL_2 } from './main.config';

const whitelist = [
      CORS_WHITELIST_URL_1,
      CORS_WHITELIST_URL_2
    ];
export const corsOptions = {
      origin: function (origin: any, callback: any) {
        //  ⚠️ FOR DEVELOPMENT PHASE ONLY!
      if (!origin) {
        return callback(null, true);
      }
        if (whitelist.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
    };