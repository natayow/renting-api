import { Router } from 'express';
import { midtransWebhookController, manualCompletePaymentController } from '../controllers/midtrans.controller';

const router = Router();

router.post('/webhook', midtransWebhookController);

router.post('/complete/:bookingId', manualCompletePaymentController);

export default router;
