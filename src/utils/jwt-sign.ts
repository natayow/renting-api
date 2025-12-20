import { SignOptions, sign } from "jsonwebtoken";

export const jwtSign = (
    payload: any,
    secretkey: string,
    options: SignOptions
) => {
    return sign(payload, secretkey, options);
};