import { Router } from 'express';
import {
    createRoomController,
    getAllRoomsController,
    getRoomsByPropertyController,
    getRoomByIdController,
    updateRoomController,
    deleteRoomController,
    getRoomAvailabilityController,
    updateRoomAvailabilityController,
    bulkUpdateRoomAvailabilityController,
    getPeakSeasonRatesController,
    createPeakSeasonRateController,
    bulkCreatePeakSeasonRatesController,
    updatePeakSeasonRateController,
    deletePeakSeasonRateController,
} from '../controllers/room.controller';
import { jwtVerify, roleVerify } from '../middlewares/jwt-auth.middleware';
import { JWT_SECRET_KEY } from '../config/main.config';
import { 
    createRoomValidation, 
    updateRoomValidation 
} from '../validators/create-room.validator';
import { handleValidationErrors } from '../middlewares/validator-request';
import {
    updateRoomAvailabilityValidation,
    bulkUpdateRoomAvailabilityValidation,
} from '../validators/room-availability.validator';
import {
    createPeakSeasonRateValidation,
    bulkCreatePeakSeasonRatesValidation,
    updatePeakSeasonRateValidation,
    deletePeakSeasonRateValidation,
} from '../validators/peak-season.validator';

const router = Router();

router.get('/', getAllRoomsController);
router.get('/:id', getRoomByIdController);
router.get('/property/:propertyId', getRoomsByPropertyController);

router.post(
    '/',
    jwtVerify(JWT_SECRET_KEY),
    roleVerify(['ADMIN']),
    createRoomValidation,
    handleValidationErrors,
    createRoomController
);

router.put(
    '/:id',
    jwtVerify(JWT_SECRET_KEY),
    roleVerify(['ADMIN']),
    updateRoomValidation,
    handleValidationErrors,
    updateRoomController
);

router.delete(
    '/:id',
    jwtVerify(JWT_SECRET_KEY),
    roleVerify(['ADMIN']),
    deleteRoomController
);

router.get(
    '/:roomId/availability',
    getRoomAvailabilityController
);

router.put(
    '/:roomId/availability',
    jwtVerify(JWT_SECRET_KEY),
    roleVerify(['ADMIN']),
    updateRoomAvailabilityValidation,
    handleValidationErrors,
    updateRoomAvailabilityController
);

router.post(
    '/:roomId/availability/bulk',
    jwtVerify(JWT_SECRET_KEY),
    roleVerify(['ADMIN']),
    bulkUpdateRoomAvailabilityValidation,
    handleValidationErrors,
    bulkUpdateRoomAvailabilityController
);

router.get(
    '/:roomId/peak-season',
    getPeakSeasonRatesController
);

router.post(
    '/:roomId/peak-season',
    jwtVerify(JWT_SECRET_KEY),
    roleVerify(['ADMIN']),
    createPeakSeasonRateValidation,
    handleValidationErrors,
    createPeakSeasonRateController
);

router.post(
    '/:roomId/peak-season/bulk',
    jwtVerify(JWT_SECRET_KEY),
    roleVerify(['ADMIN']),
    bulkCreatePeakSeasonRatesValidation,
    handleValidationErrors,
    bulkCreatePeakSeasonRatesController
);

router.put(
    '/peak-season/:id',
    jwtVerify(JWT_SECRET_KEY),
    roleVerify(['ADMIN']),
    updatePeakSeasonRateValidation,
    handleValidationErrors,
    updatePeakSeasonRateController
);

router.delete(
    '/peak-season/:id',
    jwtVerify(JWT_SECRET_KEY),
    roleVerify(['ADMIN']),
    deletePeakSeasonRateValidation,
    handleValidationErrors,
    deletePeakSeasonRateController
);

export default router;
