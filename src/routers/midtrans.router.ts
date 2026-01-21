import { Router } from 'express';
import { midtransWebhookController, manualCompletePaymentController, testInvoiceEmailController } from '../controllers/midtrans.controller';

const router = Router();

router.post('/webhook', midtransWebhookController);

router.post('/complete/:bookingId', manualCompletePaymentController);

router.post('/test-invoice/:bookingId', testInvoiceEmailController);

export default router;
