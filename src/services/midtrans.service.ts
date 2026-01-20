import { snap, coreApi } from '../config/midtrans.config';
import prisma from '../config/prisma-client';
import { BookingStatus, PaymentStatus } from '../generated/prisma';

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
        console.error('Midtrans payment creation error:', error);
        throw new Error(`Failed to create payment: ${error.message}`);
    }
}

export async function handleMidtransNotification(notification: any) {
    try {
        const statusResponse = await (coreApi as any).transaction.notification(notification);

        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;

        console.log(
            `Transaction notification received. Order ID: ${orderId}. Transaction status: ${transactionStatus}. Fraud status: ${fraudStatus}`
        );

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

        //send email if payment is successful

        return updatedBooking;
    } catch (error: any) {
        console.error('Error handling Midtrans notification:', error);
        throw error;
    }
}

export async function checkPaymentStatus(orderId: string) {
    try {
        const statusResponse = await (coreApi as any).transaction.status(orderId);
        return statusResponse;
    } catch (error: any) {
        console.error('Error checking payment status:', error);
        throw new Error(`Failed to check payment status: ${error.message}`);
    }
}
