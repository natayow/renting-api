import { Request, Response } from 'express';
import { handleMidtransNotification } from '../services/midtrans.service';
import prisma from '../config/prisma-client';
import { BookingStatus, PaymentStatus } from '../generated/prisma';
import { sendInvoiceEmail } from '../services/mail.service';

export async function midtransWebhookController(req: Request, res: Response) {
    try {
        const notification = req.body;

        const updatedBooking = await handleMidtransNotification(notification);

        res.status(200).json({
            success: true,
            message: 'Notification processed successfully',
            data: updatedBooking,
        });
    } catch (error: any) {
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

        // Send invoice email
        try {
            const bookingWithDetails = await prisma.booking.findUnique({
                where: { id: bookingId },
                include: {
                    user: true,
                    property: {
                        include: {
                            location: true,
                        },
                    },
                    room: true,
                    payments: {
                        where: {
                            paymentStatus: PaymentStatus.SUCCESS,
                        },
                        orderBy: {
                            paidAt: 'desc',
                        },
                        take: 1,
                    },
                },
            });

            if (bookingWithDetails && bookingWithDetails.user.email) {
                const checkInDate = new Date(bookingWithDetails.checkInDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });
                const checkOutDate = new Date(bookingWithDetails.checkOutDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });
                const paidAt = bookingWithDetails.payments[0]?.paidAt
                    ? new Date(bookingWithDetails.payments[0].paidAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                      })
                    : new Date().toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                      });

                const formatCurrency = (amount: number) => {
                    return amount.toLocaleString('id-ID');
                };

                const invoiceData = {
                    bookingId: bookingWithDetails.id,
                    customerName: bookingWithDetails.user.fullName || bookingWithDetails.user.email,
                    propertyName: bookingWithDetails.property.title,
                    propertyLocation: `${bookingWithDetails.property.location.city}, ${bookingWithDetails.property.location.country}`,
                    roomName: bookingWithDetails.room?.name || undefined,
                    checkInDate,
                    checkOutDate,
                    nights: bookingWithDetails.nights,
                    guestsCount: bookingWithDetails.guestsCount,
                    nightlySubtotal: formatCurrency(bookingWithDetails.nightlySubtotalIdr),
                    cleaningFee: formatCurrency(bookingWithDetails.cleaningFeeIdr),
                    serviceFee: formatCurrency(bookingWithDetails.serviceFeeIdr),
                    discount: bookingWithDetails.discountIdr > 0 ? formatCurrency(bookingWithDetails.discountIdr) : '',
                    totalPrice: formatCurrency(bookingWithDetails.totalPriceIdr),
                    paymentMethod: 'MANUAL',
                    paidAt,
                };

                await sendInvoiceEmail({
                    to: bookingWithDetails.user.email,
                    bookingDetails: invoiceData,
                });

                console.log(`Invoice email sent successfully to ${bookingWithDetails.user.email}`);
            }
        } catch (emailError: any) {
            console.error('Failed to send invoice email:', emailError.message);
        }

        res.status(200).json({
            success: true,
            message: 'Payment completed successfully',
            data: updatedBooking,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error?.message || 'Failed to complete payment',
            data: null,
        });
    }
}

export async function testInvoiceEmailController(req: Request, res: Response) {
    try {
        const { bookingId } = req.params;

        const bookingWithDetails = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                user: true,
                property: {
                    include: {
                        location: true,
                    },
                },
                room: true,
                payments: {
                    where: {
                        paymentStatus: PaymentStatus.SUCCESS,
                    },
                    orderBy: {
                        paidAt: 'desc',
                    },
                    take: 1,
                },
            },
        });

        if (!bookingWithDetails) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
                data: null,
            });
        }

        if (!bookingWithDetails.user.email) {
            return res.status(400).json({
                success: false,
                message: 'User email not found',
                data: null,
            });
        }

        const checkInDate = new Date(bookingWithDetails.checkInDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const checkOutDate = new Date(bookingWithDetails.checkOutDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const paidAt = bookingWithDetails.payments[0]?.paidAt
            ? new Date(bookingWithDetails.payments[0].paidAt).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
              })
            : new Date().toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
              });

        const formatCurrency = (amount: number) => {
            return amount.toLocaleString('id-ID');
        };

        const invoiceData = {
            bookingId: bookingWithDetails.id,
            customerName: bookingWithDetails.user.fullName || bookingWithDetails.user.email,
            propertyName: bookingWithDetails.property.title,
            propertyLocation: `${bookingWithDetails.property.location.city}, ${bookingWithDetails.property.location.country}`,
            roomName: bookingWithDetails.room?.name || undefined,
            checkInDate,
            checkOutDate,
            nights: bookingWithDetails.nights,
            guestsCount: bookingWithDetails.guestsCount,
            nightlySubtotal: formatCurrency(bookingWithDetails.nightlySubtotalIdr),
            cleaningFee: formatCurrency(bookingWithDetails.cleaningFeeIdr),
            serviceFee: formatCurrency(bookingWithDetails.serviceFeeIdr),
            discount: bookingWithDetails.discountIdr > 0 ? formatCurrency(bookingWithDetails.discountIdr) : '',
            totalPrice: formatCurrency(bookingWithDetails.totalPriceIdr),
            paymentMethod: bookingWithDetails.payments[0]?.paymentMethod || 'TEST',
            paidAt,
        };

        console.log('Sending test invoice email to:', bookingWithDetails.user.email);
        console.log('Invoice data:', invoiceData);

        await sendInvoiceEmail({
            to: bookingWithDetails.user.email,
            bookingDetails: invoiceData,
        });

        res.status(200).json({
            success: true,
            message: `Invoice email sent successfully to ${bookingWithDetails.user.email}`,
            data: invoiceData,
        });
    } catch (error: any) {
        console.error('Test invoice email error:', error);
        res.status(500).json({
            success: false,
            message: error?.message || 'Failed to send test invoice email',
            data: null,
        });
    }
}
