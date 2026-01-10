import { Request, Response } from 'express';
import {
    createBookingService,
    getBookingByIdService,
    getUserBookingsService,
    getAvailableRoomsService,
    calculateBookingPriceService,
    processPaymentGatewayWebhook,
    cancelBookingService,
} from '../services/booking.service';
import { CreateBookingInput } from '../types/booking.types';

export async function createBookingController(req: Request, res: Response) {
    try {
        const {
            propertyId,
            roomId,
            checkInDate,
            checkOutDate,
            nights,
            guestsCount,
            paymentMethod,
        } = req.body;

        const payload = res.locals.payload as { userId: string; role: string };
        const userId = payload?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. User not authenticated.',
                data: null,
            });
        }

        if (
            !propertyId ||
            !roomId ||
            !checkInDate ||
            !checkOutDate ||
            !nights ||
            !guestsCount ||
            !paymentMethod
        ) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                data: null,
            });
        }

        if (!['BANK_TRANSFER', 'PAYMENT_GATEWAY'].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message:
                    'Invalid payment method. Must be BANK_TRANSFER or PAYMENT_GATEWAY',
                data: null,
            });
        }

        const bookingInput: CreateBookingInput = {
            userId,
            propertyId,
            roomId,
            checkInDate: new Date(checkInDate),
            checkOutDate: new Date(checkOutDate),
            nights: Number(nights),
            guestsCount: Number(guestsCount),
            paymentMethod,
        };

        const booking = await createBookingService(bookingInput);

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: booking,
        });
    } catch (error: any) {
        console.error('Error creating booking:', error);

        let statusCode = 500;
        if (
            error.message.includes('not found') ||
            error.message.includes('not available') ||
            error.message.includes('accommodate') ||
            error.message.includes('Invalid')
        ) {
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to create booking',
            data: null,
        });
    }
}

export async function getBookingByIdController(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const payload = res.locals.payload as { userId: string; role: string };
        const userId = payload?.userId;

        const booking = await getBookingByIdService(id);

        if (booking.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to view this booking',
                data: null,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Booking retrieved successfully',
            data: booking,
        });
    } catch (error: any) {
        console.error('Error getting booking:', error);

        const statusCode = error.message.includes('not found') ? 404 : 500;

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to retrieve booking',
            data: null,
        });
    }
}


export async function getUserBookingsController(req: Request, res: Response) {
    try {
        const payload = res.locals.payload as { userId: string; role: string };
        const userId = payload?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. User not authenticated.',
                data: null,
            });
        }

        const bookings = await getUserBookingsService(userId);

        res.status(200).json({
            success: true,
            message: 'Bookings retrieved successfully',
            data: bookings,
        });
    } catch (error: any) {
        console.error('Error getting user bookings:', error);

        res.status(500).json({
            success: false,
            message: error?.message || 'Failed to retrieve bookings',
            data: null,
        });
    }
}


export async function getAvailableRoomsController(req: Request, res: Response) {
    try {
        const { propertyId, checkInDate, checkOutDate, guestsCount } = req.query;

        if (!propertyId || !checkInDate || !checkOutDate) {
            return res.status(400).json({
                success: false,
                message: 'Missing required query parameters: propertyId, checkInDate, checkOutDate',
                data: null,
            });
        }

        const availableRooms = await getAvailableRoomsService({
            propertyId: propertyId as string,
            checkInDate: new Date(checkInDate as string),
            checkOutDate: new Date(checkOutDate as string),
            guestsCount: guestsCount ? Number(guestsCount) : undefined,
        });

        res.status(200).json({
            success: true,
            message: 'Available rooms retrieved successfully',
            data: availableRooms,
        });
    } catch (error: any) {
        console.error('Error getting available rooms:', error);

        const statusCode = error.message.includes('date') ? 400 : 500;

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to retrieve available rooms',
            data: null,
        });
    }
}


export async function calculateBookingPriceController(req: Request, res: Response) {
    try {
        const { roomId, checkInDate, checkOutDate } = req.body;

        if (!roomId || !checkInDate || !checkOutDate) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: roomId, checkInDate, checkOutDate',
                data: null,
            });
        }

        const pricing = await calculateBookingPriceService(
            roomId,
            checkInDate,
            checkOutDate
        );

        res.status(200).json({
            success: true,
            message: 'Price calculated successfully',
            data: pricing,
        });
    } catch (error: any) {
        console.error('Error calculating price:', error);

        const statusCode = error.message.includes('not found') ? 404 : 400;

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to calculate price',
            data: null,
        });
    }
}

export async function paymentGatewayWebhookController(req: Request, res: Response) {
    try {
        const { orderId, transactionId, status, amount, signature } = req.body;

      
        if (!transactionId || !status || amount === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required webhook fields',
            });
        }

        const booking = await processPaymentGatewayWebhook(
            transactionId,
            status,
            amount
        );

        res.status(200).json({
            success: true,
            message: 'Webhook processed successfully',
            data: booking,
        });
    } catch (error: any) {
        console.error('Error processing webhook:', error);

        res.status(500).json({
            success: false,
            message: error?.message || 'Failed to process webhook',
        });
    }
}


export async function cancelBookingController(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { cancelReason } = req.body;
        const payload = res.locals.payload as { userId: string; role: string };
        const userId = payload?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. User not authenticated.',
                data: null,
            });
        }

        const booking = await cancelBookingService(id, userId, cancelReason);

        res.status(200).json({
            success: true,
            message: 'Booking canceled successfully',
            data: booking,
        });
    } catch (error: any) {
        console.error('Error canceling booking:', error);

        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        } else if (error.message.includes('Unauthorized') || error.message.includes('already')) {
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            message: error?.message || 'Failed to cancel booking',
            data: null,
        });
    }
}
