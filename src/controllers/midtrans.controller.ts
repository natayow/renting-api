import { Request, Response } from 'express';
import { handleMidtransNotification } from '../services/midtrans.service';
import prisma from '../config/prisma-client';
import { BookingStatus, PaymentStatus } from '../generated/prisma';

export async function midtransWebhookController(req: Request, res: Response) {
    try {
        console.log('Received Midtrans webhook:', req.body);

        const notification = req.body;

        const updatedBooking = await handleMidtransNotification(notification);

        res.status(200).json({
            success: true,
            message: 'Notification processed successfully',
            data: updatedBooking,
        });
    } catch (error: any) {
        console.error('Error processing Midtrans webhook:', error);

        res.status(500).json({
            success: false,
            message: error?.message || 'Failed to process notification',
            data: null,
        });
    }
}

export async function manualCompletePaymentController(req: Request, res: Response) {
    try {
        const { bookingId } = req.params;

        console.log('Manually completing payment for booking:', bookingId);

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
                data: null,
            });
        }

        const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: BookingStatus.CONFIRMED,
            },
        });

        const payment = await prisma.payment.findFirst({
            where: { bookingId },
        });

        if (payment) {
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    paymentStatus: PaymentStatus.SUCCESS,
                    paidAt: new Date(),
                },
            });
        }

        res.status(200).json({
            success: true,
            message: 'Payment completed successfully',
            data: updatedBooking,
        });
    } catch (error: any) {
        console.error('Error completing payment:', error);

        res.status(500).json({
            success: false,
            message: error?.message || 'Failed to complete payment',
            data: null,
        });
    }
}
