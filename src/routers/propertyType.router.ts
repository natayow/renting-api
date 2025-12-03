import { Router } from 'express';
import {
    createPropertyTypeController,
    getAllPropertyTypesController,
    getPropertyTypeByIdController,
    updatePropertyTypeController,
    deletePropertyTypeController,
} from '../controllers/propertyType.controller';

const router = Router();


router.post('/', createPropertyTypeController);
router.get('/', getAllPropertyTypesController);
router.get('/:id', getPropertyTypeByIdController);
router.put('/:id', updatePropertyTypeController);

router.delete('/:id', deletePropertyTypeController);

export default router;
