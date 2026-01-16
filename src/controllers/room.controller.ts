import { Request, Response } from 'express';
import {
    createRoomService,
    getAllRoomsService,
    getRoomsByPropertyService,
    getRoomByIdService,
    updateRoomService,
    deleteRoomService,
    getRoomAvailabilityService,
    updateRoomAvailabilityService,
    bulkUpdateRoomAvailabilityService,
    getPeakSeasonRatesService,
    createPeakSeasonRateService,
    bulkCreatePeakSeasonRatesService,
    updatePeakSeasonRateService,
    deletePeakSeasonRateService,
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

export async function getRoomAvailabilityController(req: Request, res: Response) {
    try {
        const { roomId } = req.params;
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate as string) : undefined;
        const end = endDate ? new Date(endDate as string) : undefined;

        const availability = await getRoomAvailabilityService(roomId, start, end);

        res.status(200).json({
            success: true,
            message: 'Room availability retrieved successfully',
            data: availability,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error?.message || 'Failed to retrieve room availability',
            data: null,
        });
    }
}

export async function updateRoomAvailabilityController(req: Request, res: Response) {
    try {
        const { roomId } = req.params;
        const { date, isAvailable } = req.body;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date is required',
                data: null,
            });
        }

        const availability = await updateRoomAvailabilityService(
            roomId,
            new Date(date),
            isAvailable
        );

        res.status(200).json({
            success: true,
            message: 'Room availability updated successfully',
            data: availability,
        });
    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to update room availability',
            data: null,
        });
    }
}

export async function bulkUpdateRoomAvailabilityController(req: Request, res: Response) {
    try {
        const { roomId } = req.params;
        const { dates } = req.body;

        if (!Array.isArray(dates) || dates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Dates array is required',
                data: null,
            });
        }

        const formattedDates = dates.map((item: any) => ({
            date: new Date(item.date),
            isAvailable: item.isAvailable,
        }));

        const results = await bulkUpdateRoomAvailabilityService(roomId, formattedDates);

        res.status(200).json({
            success: true,
            message: 'Room availability updated successfully',
            data: results,
        });
    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to bulk update room availability',
            data: null,
        });
    }
}

export async function getPeakSeasonRatesController(req: Request, res: Response) {
    try {
        const { roomId } = req.params;
        const { includeInactive } = req.query;

        const peakSeasonRates = await getPeakSeasonRatesService(
            roomId,
            includeInactive === 'true'
        );

        res.status(200).json({
            success: true,
            message: 'Peak season rates retrieved successfully',
            data: peakSeasonRates,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error?.message || 'Failed to retrieve peak season rates',
            data: null,
        });
    }
}

export async function createPeakSeasonRateController(req: Request, res: Response) {
    try {
        const { roomId } = req.params;
        const { startDate, endDate, adjustmentType, adjustmentValue, note } = req.body;

        if (!startDate || !endDate || !adjustmentType || adjustmentValue === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                data: null,
            });
        }

        const peakSeasonRate = await createPeakSeasonRateService({
            roomId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            adjustmentType,
            adjustmentValue: Number(adjustmentValue),
            note,
        });

        res.status(201).json({
            success: true,
            message: 'Peak season rate created successfully',
            data: peakSeasonRate,
        });
    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        } else if (error.message.includes('must be')) {
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to create peak season rate',
            data: null,
        });
    }
}

export async function bulkCreatePeakSeasonRatesController(req: Request, res: Response) {
    try {
        const { roomId } = req.params;
        const { rates } = req.body;

        if (!Array.isArray(rates) || rates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Rates array is required',
                data: null,
            });
        }

        const formattedRates = rates.map((rate: any) => ({
            startDate: new Date(rate.startDate),
            endDate: new Date(rate.endDate),
            adjustmentType: rate.adjustmentType,
            adjustmentValue: Number(rate.adjustmentValue),
            note: rate.note,
        }));

        const results = await bulkCreatePeakSeasonRatesService(roomId, formattedRates);

        res.status(201).json({
            success: true,
            message: 'Peak season rates created successfully',
            data: results,
        });
    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        } else if (error.message.includes('must be')) {
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to bulk create peak season rates',
            data: null,
        });
    }
}

export async function updatePeakSeasonRateController(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { startDate, endDate, adjustmentType, adjustmentValue, note, isActive } = req.body;

        const data: any = {};
        if (startDate) data.startDate = new Date(startDate);
        if (endDate) data.endDate = new Date(endDate);
        if (adjustmentType) data.adjustmentType = adjustmentType;
        if (adjustmentValue !== undefined) data.adjustmentValue = Number(adjustmentValue);
        if (note !== undefined) data.note = note;
        if (isActive !== undefined) data.isActive = isActive;

        const updatedRate = await updatePeakSeasonRateService(id, data);

        res.status(200).json({
            success: true,
            message: 'Peak season rate updated successfully',
            data: updatedRate,
        });
    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        } else if (error.message.includes('must be')) {
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to update peak season rate',
            data: null,
        });
    }
}

export async function deletePeakSeasonRateController(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const deletedRate = await deletePeakSeasonRateService(id);

        res.status(200).json({
            success: true,
            message: 'Peak season rate deleted successfully',
            data: deletedRate,
        });
    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to delete peak season rate',
            data: null,
        });
    }
}
