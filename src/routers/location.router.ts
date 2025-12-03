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

const router = Router();

router.post('/', createLocationController);
router.get('/', getAllLocationsController);
router.get('/search/country', getLocationsByCountryController);
router.get('/search/city', getLocationsByCityController);
router.get('/:id', getLocationByIdController);
router.put('/:id', updateLocationController);
router.delete('/:id', deleteLocationController);

export default router;
