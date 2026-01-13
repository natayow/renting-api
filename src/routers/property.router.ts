import { Router } from 'express';
import {
    createPropertyController,
    getAllPropertiesController,
    getPropertyByIdController,
    updatePropertyController,
    deletePropertyController,
    getPropertiesByAdminController,
    updatePropertyStatusController,
} from '../controllers/property.controller';
import { jwtVerify, roleVerify } from '../middlewares/jwt-auth.middleware';
import { JWT_SECRET_KEY } from '../config/main.config';
import { uploaderMulter } from '../utils/multer-uploads';
import { 
    createPropertyValidation, 
    updatePropertyValidation,
    updatePropertyStatusValidation 
} from '../validators/create-property.validator';
import { handleValidationErrors } from '../middlewares/validator-request';
import { Request, Response, NextFunction } from 'express';

const router = Router();

router.get('/', getAllPropertiesController);
router.get('/:id', getPropertyByIdController);

router.post(
    '/',
    jwtVerify(JWT_SECRET_KEY),
    roleVerify(['ADMIN']),
    (req: Request, res: Response, next: NextFunction) => {
        const upload = uploaderMulter(['jpg', 'jpeg', 'png', 'webp', 'svg']).any();
        upload(req, res, (err: any) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message || 'File upload error',
                    data: null
                });
            }
            next();
        });
    },
    createPropertyValidation,
    handleValidationErrors,
    createPropertyController
);

router.get('/admin/:adminUserId', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), getPropertiesByAdminController);

router.put('/:id', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), updatePropertyValidation, handleValidationErrors, updatePropertyController);

router.patch('/:id/status', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), updatePropertyStatusValidation, handleValidationErrors, updatePropertyStatusController);

router.delete('/:id', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), deletePropertyController);

export default router;
