import { Request, Response } from 'express';
import {
    createPropertyService,
    getAllPropertiesService,
    getPropertyByIdService,
    updatePropertyService,
    deletePropertyService,
    getPropertiesByAdminService,
    updatePropertyStatusService,
} from '../services/property.service';
import { PropertyStatus } from '../generated/prisma';

export async function createPropertyController(req: Request, res: Response) {
    try {
        const {
            adminUserId,
            title,
            description,
            typeId,
            city,
            country,
            address,
            status,
        } = req.body;

        let facilityIds: string[] = [];
        
        if (req.body.facilityIds) {
            if (Array.isArray(req.body.facilityIds)) {
                facilityIds = req.body.facilityIds;
            } else if (typeof req.body.facilityIds === 'string') {
                try {
                    facilityIds = JSON.parse(req.body.facilityIds);
                } catch (e) {
                    facilityIds = [req.body.facilityIds];
                }
            }
        } else if (req.body['facilityIds[]']) {
            facilityIds = Array.isArray(req.body['facilityIds[]']) 
                ? req.body['facilityIds[]'] 
                : [req.body['facilityIds[]']];
        }

        let rooms: any[] = [];
        
        if (req.body.rooms) {
            if (Array.isArray(req.body.rooms)) {
                rooms = req.body.rooms;
            } else if (typeof req.body.rooms === 'string') {
                try {
                    rooms = JSON.parse(req.body.rooms);
                } catch (e) {
                    // JSON parse error handled
                }
            }
        }

        let files: Express.Multer.File[] = [];

        if (req.files && Array.isArray(req.files)) {
            files = req.files.filter(file => file.fieldname === 'propertyImages');
        }


        const result = await createPropertyService({
            adminUserId,
            title,
            description,
            typeId,
            city,
            country,
            address,
            status,
            files,
            facilityIds,
            rooms,
        });

        res.status(201).json({
            success: true,
            message: 'Property created successfully',
            data: result,
        });
    } catch (error: any) {
        let statusCode = 500;
        if (
            error.message.includes('required') ||
            error.message.includes('must') ||
            error.message.includes('cannot') ||
            error.message.includes('Invalid')
        ) {
            statusCode = 400;
        } else if (error.message.includes('not found')) {
            statusCode = 404;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to create property',
            data: null,
        });
    }
}

export async function getAllPropertiesController(req: Request, res: Response) {
    try {
        const {
            status,
            locationId,
            typeId,
            adminUserId,
            minPrice,
            maxPrice,
            search,
            page,
            limit,
            sortBy,
            sortOrder,
        } = req.query;

        const filters: any = {};

        if (status) filters.status = status as PropertyStatus;
        if (locationId) filters.locationId = locationId as string;
        if (typeId) filters.typeId = typeId as string;
        if (adminUserId) filters.adminUserId = adminUserId as string;
        if (minPrice) filters.minPrice = parseInt(minPrice as string);
        if (maxPrice) filters.maxPrice = parseInt(maxPrice as string);
        if (search) filters.search = search as string;
        if (page) filters.page = parseInt(page as string);
        if (limit) filters.limit = parseInt(limit as string);
        if (sortBy) filters.sortBy = sortBy as 'name' | 'price';
        if (sortOrder) filters.sortOrder = sortOrder as 'asc' | 'desc';

        const result = await getAllPropertiesService(filters);

        res.status(200).json({
            success: true,
            message: 'Properties retrieved successfully',
            data: result.data,
            pagination: result.pagination,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error?.message || 'Failed to retrieve properties',
            data: null,
        });
    }
}

export async function getPropertyByIdController(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const property = await getPropertyByIdService(id);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found',
                data: null,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Property retrieved successfully',
            data: property,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error?.message || 'Failed to retrieve property',
            data: null,
        });
    }
}

export async function updatePropertyController(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            typeId,
            locationId,
            city,
            country,
            address,
            status,
            facilityIds,
        } = req.body;

       
        const result = await updatePropertyService(
            id,
            {
                title,
                description,
                typeId,
                locationId,
                city,
                country,
                address,
                status,
                facilityIds,
            },
        );

        res.status(200).json({
            success: true,
            message: 'Property updated successfully',
            data: result,
        });
    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        } else if (
            error.message.includes('required') ||
            error.message.includes('must') ||
            error.message.includes('cannot') ||
            error.message.includes('Invalid')
        ) {
            statusCode = 400;
        } else if (error.message.includes('permission')) {
            statusCode = 403;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to update property',
            data: null,
        });
    }
}

export async function deletePropertyController(req: Request, res: Response) {
    try {
        const { id } = req.params;

        await deletePropertyService(
            id,
        );

        res.status(200).json({
            success: true,
            message: 'Property deleted successfully',
            data: null,
        });
    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        } else if (error.message.includes('permission')) {
            statusCode = 403;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to delete property',
            data: null,
        });
    }
}

export async function getPropertiesByAdminController(req: Request, res: Response) {
    try {
        const { adminUserId } = req.params;

        const properties = await getPropertiesByAdminService(adminUserId);

        res.status(200).json({
            success: true,
            message: 'Properties retrieved successfully',
            data: properties,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error?.message || 'Failed to retrieve properties',
            data: null,
        });
    }
}

export async function updatePropertyStatusController(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required',
                data: null,
            });
        }

        const validStatuses: PropertyStatus[] = ['DRAFT', 'ACTIVE', 'INACTIVE'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: DRAFT, ACTIVE, INACTIVE',
                data: null,
            });
        }


        const result = await updatePropertyStatusService(
            id,
            status,
        );

        res.status(200).json({
            success: true,
            message: 'Property status updated successfully',
            data: result,
        });
    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        } else if (error.message.includes('permission')) {
            statusCode = 403;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to update property status',
            data: null,
        });
    }
}
