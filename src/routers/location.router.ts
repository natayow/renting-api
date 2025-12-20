import { Router } from 'express';
import {
    createLocationController,
    getAllLocationsController,
    getLocationByIdController,
    getLocationsByCountryController,
    getLocationsByCityController,
    updateLocationController,
    deleteLocationController,
} from '../controllers/location.controller';
import { 
    createLocationValidation, 
    updateLocationValidation,
    searchByCountryValidation,
    searchByCityValidation 
} from '../validators/create-location.validator';
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

router.post('/', createLocationValidation, handleValidationErrors, createLocationController);
router.get('/', getAllLocationsController);
router.get('/search/country', searchByCountryValidation, handleValidationErrors, getLocationsByCountryController);
router.get('/search/city', searchByCityValidation, handleValidationErrors, getLocationsByCityController);
router.get('/:id', getLocationByIdController);
router.put('/:id', updateLocationValidation, handleValidationErrors, updateLocationController);
router.delete('/:id', deleteLocationController);

export default router;
