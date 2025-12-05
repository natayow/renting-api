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
            locationId,
            maxGuests,
            bedrooms,
            beds,
            bathrooms,
            minNights,
            maxNights,
            basePricePerNightIdr,
            status,
        } = req.body;

        let files: Express.Multer.File[] = [];

    if (req.files && !Array.isArray(req.files)) {
    const fileGroups = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };
    files = fileGroups['propertyImages'] || [];
  }

        // You can get adminUserId from JWT payload instead of request body for security
        // const adminUserId = res.locals.payload?.id;

        const result = await createPropertyService({
            adminUserId,
            title,
            description,
            typeId,
            locationId,
            maxGuests,
            bedrooms,
            beds,
            bathrooms,
            minNights,
            maxNights,
            basePricePerNightIdr,
            status,
            files,
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
            minGuests,
        } = req.query;

        const filters: any = {};

        if (status) filters.status = status as PropertyStatus;
        if (locationId) filters.locationId = locationId as string;
        if (typeId) filters.typeId = typeId as string;
        if (adminUserId) filters.adminUserId = adminUserId as string;
        if (minPrice) filters.minPrice = parseInt(minPrice as string);
        if (maxPrice) filters.maxPrice = parseInt(maxPrice as string);
        if (minGuests) filters.minGuests = parseInt(minGuests as string);

        const properties = await getAllPropertiesService(filters);

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
            maxGuests,
            bedrooms,
            beds,
            bathrooms,
            minNights,
            maxNights,
            basePricePerNightIdr,
            status,
        } = req.body;

        // Optional: Get adminUserId from JWT payload for ownership verification
        // const adminUserId = res.locals.payload?.id;

        const result = await updatePropertyService(
            id,
            {
                title,
                description,
                typeId,
                locationId,
                maxGuests,
                bedrooms,
                beds,
                bathrooms,
                minNights,
                maxNights,
                basePricePerNightIdr,
                status,
            },
            // adminUserId // Uncomment to enable ownership verification
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

        // Optional: Get adminUserId from JWT payload for ownership verification
        // const adminUserId = res.locals.payload?.id;

        await deletePropertyService(
            id,
            // adminUserId // Uncomment to enable ownership verification
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

        // Optional: Verify that the requesting user is the same admin
        // const requestingUserId = res.locals.payload?.id;
        // if (requestingUserId !== adminUserId) {
        //     return res.status(403).json({
        //         success: false,
        //         message: 'You do not have permission to view these properties',
        //         data: null,
        //     });
        // }

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

        // Validate status enum
        const validStatuses: PropertyStatus[] = ['DRAFT', 'ACTIVE', 'INACTIVE'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: DRAFT, ACTIVE, INACTIVE',
                data: null,
            });
        }

        // Optional: Get adminUserId from JWT payload for ownership verification
        // const adminUserId = res.locals.payload?.id;

        const result = await updatePropertyStatusService(
            id,
            status,
            // adminUserId // Uncomment to enable ownership verification
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
