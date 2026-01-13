import { Router } from 'express';
import {
    createPropertyTypeController,
    getAllPropertyTypesController,
    getPropertyTypeByIdController,
    updatePropertyTypeController,
    deletePropertyTypeController,
} from '../controllers/propertyType.controller';
import { jwtVerify, roleVerify } from '../middlewares/jwt-auth.middleware';
import { JWT_SECRET_KEY } from '../config/main.config';

const router = Router();


router.post('/', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), createPropertyTypeController);
router.get('/', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), getAllPropertyTypesController);
router.get('/:id', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), getPropertyTypeByIdController);
router.put('/:id', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), updatePropertyTypeController);

router.delete('/:id', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), deletePropertyTypeController);

export default router;
