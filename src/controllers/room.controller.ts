import { Request, Response } from 'express';
import {
    createRoomService,
    getAllRoomsService,
    getRoomsByPropertyService,
    getRoomByIdService,
    updateRoomService,
    deleteRoomService,
} from '../services/room.service';

export async function createRoomController(req: Request, res: Response) {
    try {
        const {
            propertyId,
            name,
            description,
            maxGuests,
            beds,
            bathrooms,
            basePricePerNightIdr,
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
        }

        const result = await createRoomService({
            propertyId,
            name,
            description,
            maxGuests,
            beds,
            bathrooms,
            basePricePerNightIdr,
            facilityIds,
        });

        res.status(201).json({
            success: true,
            message: 'Room created successfully',
            data: result,
        });
    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('not found') || error.message.includes('required')) {
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to create room',
            data: null,
        });
    }
}

export async function getAllRoomsController(req: Request, res: Response) {
    try {
        const rooms = await getAllRoomsService();

        res.status(200).json({
            success: true,
            message: 'Rooms retrieved successfully',
            data: rooms,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error?.message || 'Failed to retrieve rooms',
            data: null,
        });
    }
}

export async function getRoomsByPropertyController(req: Request, res: Response) {
    try {
        const { propertyId } = req.params;

        const rooms = await getRoomsByPropertyService(propertyId);

        res.status(200).json({
            success: true,
            message: 'Rooms retrieved successfully',
            data: rooms,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error?.message || 'Failed to retrieve rooms',
            data: null,
        });
    }
}

export async function getRoomByIdController(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const room = await getRoomByIdService(id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found',
                data: null,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Room retrieved successfully',
            data: room,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error?.message || 'Failed to retrieve room',
            data: null,
        });
    }
}

export async function updateRoomController(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            maxGuests,
            beds,
            bathrooms,
            basePricePerNightIdr,
        } = req.body;

        let facilityIds: string[] | undefined = undefined;
        
        if (req.body.facilityIds !== undefined) {
            if (Array.isArray(req.body.facilityIds)) {
                facilityIds = req.body.facilityIds;
            } else if (typeof req.body.facilityIds === 'string') {
                try {
                    facilityIds = JSON.parse(req.body.facilityIds);
                } catch (e) {
                    facilityIds = [req.body.facilityIds];
                }
            }
        }

        const result = await updateRoomService(id, {
            name,
            description,
            maxGuests,
            beds,
            bathrooms,
            basePricePerNightIdr,
            facilityIds,
        });

        res.status(200).json({
            success: true,
            message: 'Room updated successfully',
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
            message: error?.message || 'Failed to update room',
            data: null,
        });
    }
}

export async function deleteRoomController(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const result = await deleteRoomService(id);

        res.status(200).json({
            success: true,
            message: 'Room deleted successfully',
            data: result,
        });
    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        } else if (error.message.includes('Cannot delete')) {
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to delete room',
            data: null,
        });
    }
}
