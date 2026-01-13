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
import { handleValidationErrors } from '../middlewares/validator-request';
import { jwtVerify, roleVerify } from '../middlewares/jwt-auth.middleware';
import { JWT_SECRET_KEY } from '../config/main.config';

const router = Router();

router.post('/', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), createLocationValidation, handleValidationErrors, createLocationController);

router.get('/', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), getAllLocationsController);

router.get('/search/country', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), searchByCountryValidation, handleValidationErrors, getLocationsByCountryController);

router.get('/search/city', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), searchByCityValidation, handleValidationErrors, getLocationsByCityController);

router.get('/:id', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), getLocationByIdController);

router.put('/:id', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), updateLocationValidation, handleValidationErrors, updateLocationController);

router.delete('/:id', jwtVerify(JWT_SECRET_KEY), roleVerify(['ADMIN']), deleteLocationController);

export default router;
