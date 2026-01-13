import { Router } from 'express';
import {
    createRoomController,
    getAllRoomsController,
    getRoomsByPropertyController,
    getRoomByIdController,
    updateRoomController,
    deleteRoomController,
} from '../controllers/room.controller';
import { jwtVerify, roleVerify } from '../middlewares/jwt-auth.middleware';
import { JWT_SECRET_KEY } from '../config/main.config';
import { 
    createRoomValidation, 
    updateRoomValidation 
} from '../validators/create-room.validator';
import { handleValidationErrors } from '../middlewares/validator-request';

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

export default router;
