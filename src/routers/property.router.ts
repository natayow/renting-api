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

router.get('/admin/:adminUserId', getPropertiesByAdminController);

router.put('/:id', updatePropertyValidation, handleValidationErrors, updatePropertyController);

router.patch('/:id/status', updatePropertyStatusValidation, handleValidationErrors, updatePropertyStatusController);

router.delete('/:id', deletePropertyController);

export default router;
