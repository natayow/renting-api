import { Request, Response } from 'express';
import {
    createFacilityService,
    getAllFacilitiesService,
    getFacilityByIdService,
    updateFacilityService,
    deleteFacilityService,
} from '../services/facility.service';

export async function createFacilityController(req: Request, res: Response) {
    try {
        const { name, icon } = req.body;

        const result = await createFacilityService({ name, icon });

        res.status(201).json({
            success: true,
            message: 'Facility created successfully',
            data: result,
        });
    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('already exists') || error.message.includes('required')) {
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to create facility',
            data: null,
        });
    }
}

export async function getAllFacilitiesController(req: Request, res: Response) {
    try {
        const facilities = await getAllFacilitiesService();

        res.status(200).json({
            success: true,
            message: 'Facilities retrieved successfully',
            data: facilities,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error?.message || 'Failed to retrieve facilities',
            data: null,
        });
    }
}

export async function getFacilityByIdController(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const facility = await getFacilityByIdService(id);

        if (!facility) {
            return res.status(404).json({
                success: false,
                message: 'Facility not found',
                data: null,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Facility retrieved successfully',
            data: facility,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error?.message || 'Failed to retrieve facility',
            data: null,
        });
    }
}

export async function updateFacilityController(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { name, icon } = req.body;

        const result = await updateFacilityService(id, { name, icon });

        res.status(200).json({
            success: true,
            message: 'Facility updated successfully',
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
            message: error?.message || 'Failed to update facility',
            data: null,
        });
    }
}

export async function deleteFacilityController(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const result = await deleteFacilityService(id);

        res.status(200).json({
            success: true,
            message: 'Facility deleted successfully',
            data: result,
        });
    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to delete facility',
            data: null,
        });
    }
}
