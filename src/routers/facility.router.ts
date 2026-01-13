import { Router } from 'express';
import {
    createFacilityController,
    getAllFacilitiesController,
    getFacilityByIdController,
    updateFacilityController,
    deleteFacilityController,
} from '../controllers/facility.controller';
import { jwtVerify, roleVerify } from '../middlewares/jwt-auth.middleware';
import { JWT_SECRET_KEY } from '../config/main.config';

const router = Router();

router.post('/', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), createFacilityController);
router.get('/', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), getAllFacilitiesController);
router.get('/:id', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), getFacilityByIdController);
router.put('/:id', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), updateFacilityController);
router.delete('/:id', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), deleteFacilityController);

export default router;
