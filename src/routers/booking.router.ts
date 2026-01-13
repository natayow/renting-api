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
import { handleValidationErrors } from '../middlewares/validator-request';

const router = Router();

router.get(
    '/available-rooms',
    jwtVerify(JWT_SECRET_KEY),
    availableRoomsValidation,
    handleValidationErrors,
    getAvailableRoomsController
);

router.post(
    '/calculate-price',
    jwtVerify(JWT_SECRET_KEY),
    calculatePriceValidation,
    handleValidationErrors,
    calculateBookingPriceController
);

router.post('/webhook/payment', paymentGatewayWebhookController);

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
