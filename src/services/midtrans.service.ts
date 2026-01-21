import { snap, coreApi } from '../config/midtrans.config';
import prisma from '../config/prisma-client';
import { BookingStatus, PaymentStatus } from '../generated/prisma';
import { sendInvoiceEmail } from './mail.service';

interface CreatePaymentParams {
    bookingId: string;
    amount: number;
    customerName: string;
    customerEmail: string;
}

export async function createMidtransPayment({
    bookingId,
    amount,
    customerName,
    customerEmail,
}: CreatePaymentParams) {
    try {
        const parameter = {
            transaction_details: {
                order_id: bookingId,
                gross_amount: amount,
            },
            customer_details: {
                first_name: customerName,
                email: customerEmail,
            },
            enabled_payments: [
                'gopay',
                'shopeepay',
                'qris',
                'bca_va',
                'bni_va',
                'bri_va',
                'permata_va',
                'other_va',
            ],
            callbacks: {
                finish: `${process.env.FRONTEND_URL}/booking/success?order_id=${bookingId}`,
            },
        };

        const transaction = await snap.createTransaction(parameter);
        return {
            token: transaction.token,
            redirect_url: transaction.redirect_url,
        };
    } catch (error: any) {
        throw new Error(`Failed to create payment: ${error.message}`);
    }
}

export async function handleMidtransNotification(notification: any) {
    try {
        const statusResponse = await (coreApi as any).transaction.notification(notification);

        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;

        const booking = await prisma.booking.findUnique({
            where: { id: orderId },
        });

        if (!booking) {
            throw new Error(`Booking not found: ${orderId}`);
        }

        let paymentStatus: PaymentStatus;
        let bookingStatus: BookingStatus;

        if (transactionStatus === 'capture') {
            if (fraudStatus === 'accept') {
                paymentStatus = PaymentStatus.SUCCESS;
                bookingStatus = BookingStatus.CONFIRMED;
            } else {
                paymentStatus = PaymentStatus.FAILED;
                bookingStatus = BookingStatus.WAITING_PAYMENT;
            }
        } else if (transactionStatus === 'settlement') {
            paymentStatus = PaymentStatus.SUCCESS;
            bookingStatus = BookingStatus.CONFIRMED;
        } else if (
            transactionStatus === 'cancel' ||
            transactionStatus === 'deny' ||
            transactionStatus === 'expire'
        ) {
            paymentStatus = PaymentStatus.FAILED;
            bookingStatus = BookingStatus.CANCELED;
        } else if (transactionStatus === 'pending') {
            paymentStatus = PaymentStatus.PENDING;
            bookingStatus = BookingStatus.WAITING_PAYMENT;
        } else {
            paymentStatus = PaymentStatus.PENDING;
            bookingStatus = BookingStatus.WAITING_PAYMENT;
        }

        const updatedBooking = await prisma.booking.update({
            where: { id: orderId },
            data: {
                status: bookingStatus,
            },
        });

        const existingPayment = await prisma.payment.findFirst({
            where: { bookingId: orderId },
        });

        if (existingPayment) {
            await prisma.payment.update({
                where: { id: existingPayment.id },
                data: {
                    paymentStatus,
                    paymentMethod: statusResponse.payment_type,
                    providerTxId: statusResponse.transaction_id,
                    paidAt:
                        paymentStatus === PaymentStatus.SUCCESS
                            ? new Date()
                            : null,
                    failedAt:
                        paymentStatus === PaymentStatus.FAILED
                            ? new Date()
                            : null,
                },
            });
        } else {
            await prisma.payment.create({
                data: {
                    bookingId: orderId,
                    userId: booking.userId,
                    amountIdr: booking.totalPriceIdr,
                    paymentStatus,
                    paymentMethod: statusResponse.payment_type,
                    providerTxId: statusResponse.transaction_id,
                    paidAt:
                        paymentStatus === PaymentStatus.SUCCESS
                            ? new Date()
                            : null,
                    failedAt:
                        paymentStatus === PaymentStatus.FAILED
                            ? new Date()
                            : null,
                },
            });
        }

        // Send invoice email if payment is successful
        if (paymentStatus === PaymentStatus.SUCCESS) {
            console.log(`Payment successful for booking ${orderId}, attempting to send invoice email...`);
            try {
                // Fetch complete booking details with related data
                const bookingWithDetails = await prisma.booking.findUnique({
                    where: { id: orderId },
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
                    // Format dates
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

                    // Format currency
                    const formatCurrency = (amount: number) => {
                        return amount.toLocaleString('id-ID');
                    };

                    // Prepare email data
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
                        paymentMethod: statusResponse.payment_type.replace(/_/g, ' ').toUpperCase(),
                        paidAt,
                    };

                    // Send invoice email
                    await sendInvoiceEmail({
                        to: bookingWithDetails.user.email,
                        bookingDetails: invoiceData,
                    });

                    console.log(`Invoice email sent successfully to ${bookingWithDetails.user.email}`);
                }
            } catch (emailError: any) {
                // Log error but don't fail the transaction
                console.error('Failed to send invoice email:', emailError.message);
            }
        }

        return updatedBooking;
    } catch (error: any) {
        throw error;
    }
}

export async function checkPaymentStatus(orderId: string) {
    try {
        const statusResponse = await (coreApi as any).transaction.status(orderId);
        return statusResponse;
    } catch (error: any) {
        throw new Error(`Failed to check payment status: ${error.message}`);
    }
}
