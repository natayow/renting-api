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

const router = Router();

// Public routes
router.get('/', getAllPropertiesController);
router.get('/:id', getPropertyByIdController);

// Admin routes - uncomment middleware when ready to protect routes
// import { jwtVerify, roleVerify } from '../middlewares/jwt-auth.middleware';
// import { JWT_SECRET_KEY } from '../config/main.config';

// Create property (admin only)
router.post(
    '/',
    jwtVerify(JWT_SECRET_KEY),
    roleVerify(['ADMIN']),
    (req, res, next) => {
        const upload = uploaderMulter(['jpg', 'jpeg', 'png', 'webp', 'svg']).fields([
            { name: 'propertyImages', maxCount: 7 }
        ]);
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
    createPropertyController
);

// Get properties by admin
// router.get('/admin/:adminUserId', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), getPropertiesByAdminController);
router.get('/admin/:adminUserId', getPropertiesByAdminController);

// Update property (admin only)
// router.put('/:id', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), updatePropertyController);
router.put('/:id', updatePropertyController);

// Update property status (admin only)
// router.patch('/:id/status', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), updatePropertyStatusController);
router.patch('/:id/status', updatePropertyStatusController);

// Delete property (admin only - soft delete)
// router.delete('/:id', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), deletePropertyController);
router.delete('/:id', deletePropertyController);

export default router;
