declare module 'midtrans-client' {
    interface TransactionMethods {
        notification(notification: any): Promise<any>;
        status(orderId: string): Promise<any>;
        statusb2b(orderId: string): Promise<any>;
        approve(orderId: string): Promise<any>;
        deny(orderId: string): Promise<any>;
        cancel(orderId: string): Promise<any>;
        expire(orderId: string): Promise<any>;
        refund(orderId: string, params?: any): Promise<any>;
        refundDirect(orderId: string, params?: any): Promise<any>;
    }

    export class Snap {
        constructor(options: {
            isProduction: boolean;
            serverKey: string;
            clientKey: string;
        });

        createTransaction(parameter: any): Promise<{
            token: string;
            redirect_url: string;
        }>;
    }

    export class CoreApi {
        constructor(options: {
            isProduction: boolean;
            serverKey: string;
            clientKey: string;
        });

        transaction: TransactionMethods;
        
        charge(parameter: any): Promise<any>;
        capture(parameter: any): Promise<any>;
        cardRegister(parameter: any): Promise<any>;
        cardToken(parameter: any): Promise<any>;
        cardPointInquiry(tokenId: string): Promise<any>;
    }
}
