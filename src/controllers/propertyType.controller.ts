import { Request, Response } from 'express';
import {
    createPropertyTypeService,
    getAllPropertyTypesService,
    getPropertyTypeByIdService,
    updatePropertyTypeService,
    deletePropertyTypeService,
} from '../services/propertyType.service';

export async function createPropertyTypeController(req: Request, res: Response) {
    try {
        const { name } = req.body;

        const result = await createPropertyTypeService({ name });

        res.status(201).json({
            success: true,
            message: 'Property type created successfully',
            data: result,
        });
    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('already exists') || error.message.includes('required')) {
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to create property type',
            data: null,
        });
    }
}

export async function getAllPropertyTypesController(req: Request, res: Response) {
    try {
        const propertyTypes = await getAllPropertyTypesService();

        res.status(200).json({
            success: true,
            message: 'Property types retrieved successfully',
            data: propertyTypes,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error?.message || 'Failed to retrieve property types',
            data: null,
        });
    }
}

export async function getPropertyTypeByIdController(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const propertyType = await getPropertyTypeByIdService(id);

        if (!propertyType) {
            return res.status(404).json({
                success: false,
                message: 'Property type not found',
                data: null,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Property type retrieved successfully',
            data: propertyType,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error?.message || 'Failed to retrieve property type',
            data: null,
        });
    }
}

export async function updatePropertyTypeController(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const result = await updatePropertyTypeService(id, { name });

        res.status(200).json({
            success: true,
            message: 'Property type updated successfully',
            data: result,
        });
    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        } else if (error.message.includes('already exists') || error.message.includes('required')) {
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to update property type',
            data: null,
        });
    }
}

export async function deletePropertyTypeController(req: Request, res: Response) {
    try {
        const { id } = req.params;

        await deletePropertyTypeService(id);

        res.status(200).json({
            success: true,
            message: 'Property type deleted successfully',
            data: null,
        });
    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to delete property type',
            data: null,
        });
    }
}
