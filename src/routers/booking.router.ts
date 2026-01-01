import { Router } from 'express';
import {
    createBookingController,
    getBookingByIdController,
    getUserBookingsController,
    getAvailableRoomsController,
    calculateBookingPriceController,
    paymentGatewayWebhookController,
    cancelBookingController,
} from '../controllers/booking.controller';
import { jwtVerify, roleVerify } from '../middlewares/jwt-auth.middleware';
import { JWT_SECRET_KEY } from '../config/main.config';
import {
    createBookingValidation,
    calculatePriceValidation,
    availableRoomsValidation,
} from '../validators/booking.validator';
import { validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array(),
        });
    }
    next();
};

const router = Router();

// Public routes
router.get(
    '/available-rooms',
    availableRoomsValidation,
    handleValidationErrors,
    getAvailableRoomsController
);

router.post(
    '/calculate-price',
    calculatePriceValidation,
    handleValidationErrors,
    calculateBookingPriceController
);

// Webhook route (no JWT required, but should validate signature)
router.post('/webhook/payment', paymentGatewayWebhookController);

// Protected routes (require authentication)
router.post(
    '/',
    jwtVerify(JWT_SECRET_KEY),
  
    createBookingValidation,
    handleValidationErrors,
    createBookingController
);

router.get(
    '/user/me',
    jwtVerify(JWT_SECRET_KEY),

    getUserBookingsController
);

router.get(
    '/:id',
    jwtVerify(JWT_SECRET_KEY),
   
    getBookingByIdController
);

router.post(
    '/:id/cancel',
    jwtVerify(JWT_SECRET_KEY),
    
    cancelBookingController
);

export default router;
