import { Router } from 'express';
import {
    createFacilityController,
    getAllFacilitiesController,
    getFacilityByIdController,
    updateFacilityController,
    deleteFacilityController,
} from '../controllers/facility.controller';

const router = Router();

router.post('/', createFacilityController);
router.get('/', getAllFacilitiesController);
router.get('/:id', getFacilityByIdController);
router.put('/:id', updateFacilityController);
router.delete('/:id', deleteFacilityController);

export default router;
