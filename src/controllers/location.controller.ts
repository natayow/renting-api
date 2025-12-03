import { Request, Response } from 'express';
import {
    createLocationService,
    getAllLocationsService,
    getLocationByIdService,
    getLocationsByCountryService,
    getLocationsByCityService,
    updateLocationService,
    deleteLocationService,
} from '../services/location.service';

export async function createLocationController(req: Request, res: Response) {
    try {
        const { country, city, address } = req.body;

        const result = await createLocationService({ country, city, address });

        res.status(201).json({
            success: true,
            message: 'Location created successfully',
            data: result,
        });
    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('required')) {
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to create location',
            data: null,
        });
    }
}

export async function getAllLocationsController(req: Request, res: Response) {
    try {
        const locations = await getAllLocationsService();

        res.status(200).json({
            success: true,
            message: 'Locations retrieved successfully',
            data: locations,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error?.message || 'Failed to retrieve locations',
            data: null,
        });
    }
}

export async function getLocationByIdController(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const location = await getLocationByIdService(id);

        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Location not found',
                data: null,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Location retrieved successfully',
            data: location,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error?.message || 'Failed to retrieve location',
            data: null,
        });
    }
}

export async function getLocationsByCountryController(req: Request, res: Response) {
    try {
        const { country } = req.query;

        if (!country || typeof country !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Country query parameter is required',
                data: null,
            });
        }

        const locations = await getLocationsByCountryService(country);

        res.status(200).json({
            success: true,
            message: 'Locations retrieved successfully',
            data: locations,
        });
    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('required')) {
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to retrieve locations',
            data: null,
        });
    }
}

export async function getLocationsByCityController(req: Request, res: Response) {
    try {
        const { city } = req.query;

        if (!city || typeof city !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'City query parameter is required',
                data: null,
            });
        }

        const locations = await getLocationsByCityService(city);

        res.status(200).json({
            success: true,
            message: 'Locations retrieved successfully',
            data: locations,
        });
    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('required')) {
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to retrieve locations',
            data: null,
        });
    }
}

export async function updateLocationController(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { country, city, address } = req.body;

        const result = await updateLocationService(id, { country, city, address });

        res.status(200).json({
            success: true,
            message: 'Location updated successfully',
            data: result,
        });
    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        } else if (error.message.includes('required')) {
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to update location',
            data: null,
        });
    }
}

export async function deleteLocationController(req: Request, res: Response) {
    try {
        const { id } = req.params;

        await deleteLocationService(id);

        res.status(200).json({
            success: true,
            message: 'Location deleted successfully',
            data: null,
        });
    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to delete location',
            data: null,
        });
    }
}
