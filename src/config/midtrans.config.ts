import { Snap, CoreApi } from 'midtrans-client';

const snap = new Snap({
    isProduction: false, 
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
});

const coreApi = new CoreApi({
    isProduction: false, 
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
});

export { snap, coreApi };
export default snap;
