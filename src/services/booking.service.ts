import prisma from '../config/prisma-client';
import { BookingStatus, PaymentStatus } from '../generated/prisma';
import {
    CreateBookingInput,
    BookingPriceBreakdown,
    RoomAvailabilityQuery,
    AvailableRoom,
    BookingDetailsResponse,
} from '../types/booking.types';
import { createMidtransPayment } from './midtrans.service';


export async function checkRoomAvailability(
    roomId: string,
    checkInDate: Date,
    checkOutDate: Date,
    excludeBookingId?: string
): Promise<boolean> {
    const overlappingBookings = await prisma.booking.findMany({
        where: {
            roomId,
            status: {
                notIn: [BookingStatus.CANCELED, BookingStatus.EXPIRED],
            },
            deletedAt: null,
            ...(excludeBookingId && { id: { not: excludeBookingId } }),
            OR: [
                {
                    checkInDate: { lte: checkInDate },
                    checkOutDate: { gt: checkInDate },
                },
                {
                    checkInDate: { lt: checkOutDate },
                    checkOutDate: { gte: checkOutDate },
                },
                {
                    checkInDate: { gte: checkInDate },
                    checkOutDate: { lte: checkOutDate },
                },
            ],
        },
    });

    return overlappingBookings.length === 0;
}


export async function getAvailableRoomsService({
    propertyId,
    checkInDate,
    checkOutDate,
    guestsCount,
}: RoomAvailabilityQuery): Promise<AvailableRoom[]> {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkIn >= checkOut) {
        throw new Error('Check-out date must be after check-in date');
    }

    if (checkIn < new Date(new Date().setHours(0, 0, 0, 0))) {
        throw new Error('Check-in date cannot be in the past');
    }

    const rooms = await prisma.room.findMany({
        where: {
            propertyId,
            deletedAt: null,
            ...(guestsCount && { maxGuests: { gte: guestsCount } }),
        },
        include: {
            facilities: {
                include: {
                    facility: {
                        select: {
                            id: true,
                            name: true,
                            icon: true,
                        },
                    },
                },
            },
            bookings: {
                where: {
                    status: {
                        notIn: [BookingStatus.CANCELED, BookingStatus.EXPIRED],
                    },
                    deletedAt: null,
                    OR: [
                        {
                            checkInDate: { lte: checkIn },
                            checkOutDate: { gt: checkIn },
                        },
                        {
                            checkInDate: { lt: checkOut },
                            checkOutDate: { gte: checkOut },
                        },
                        {
                            checkInDate: { gte: checkIn },
                            checkOutDate: { lte: checkOut },
                        },
                    ],
                },
            },
        },
    });

    const availableRooms: AvailableRoom[] = rooms.map((room) => ({
        id: room.id,
        name: room.name,
        description: room.description,
        maxGuests: room.maxGuests,
        beds: room.beds,
        bathrooms: room.bathrooms,
        basePricePerNightIdr: room.basePricePerNightIdr,
        isAvailable: room.bookings.length === 0,
        facilities: room.facilities.map((rf) => ({
            id: rf.facility.id,
            name: rf.facility.name,
            icon: rf.facility.icon,
        })),
    }));

    return availableRooms;
}

export async function calculateBookingPrice(
    roomId: string,
    checkInDate: Date,
    checkOutDate: Date,
    nights: number
): Promise<BookingPriceBreakdown> {
    const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
            property: {
                include: {
                    specialPrices: {
                        where: {
                            isActive: true,
                            deletedAt: null,
                        },
                    },
                },
            },
        },
    });

    if (!room) {
        throw new Error('Room not found');
    }

    const nightlyRates: Array<{ date: Date; pricePerNightIdr: number }> = [];
    let nightlySubtotalIdr = 0;

    let currentDate = new Date(checkInDate);
    for (let i = 0; i < nights; i++) {
        let priceForNight = room.basePricePerNightIdr;

        const specialPrice = room.property.specialPrices.find((sp) => {
            return (
                currentDate >= sp.startDate &&
                currentDate <= sp.endDate &&
                sp.isActive
            );
        });

        if (specialPrice) {
            priceForNight = specialPrice.pricePerNightIdr;
        }

        nightlyRates.push({
            date: new Date(currentDate),
            pricePerNightIdr: priceForNight,
        });

        nightlySubtotalIdr += priceForNight;
        currentDate.setDate(currentDate.getDate() + 1);
    }

    const cleaningFeeIdr = Math.round(nightlySubtotalIdr * 0.05); 
    const serviceFeeIdr = Math.round(nightlySubtotalIdr * 0.03); 
    const discountIdr = 0;

    const totalPriceIdr =
        nightlySubtotalIdr + cleaningFeeIdr + serviceFeeIdr - discountIdr;

    return {
        nightlySubtotalIdr,
        cleaningFeeIdr,
        serviceFeeIdr,
        discountIdr,
        totalPriceIdr,
        nightlyRates,
    };
}

export async function createBookingService(
    input: CreateBookingInput
): Promise<BookingDetailsResponse> {
    const {
        userId,
        propertyId,
        roomId,
        checkInDate,
        checkOutDate,
        nights,
        guestsCount,
        paymentMethod,
    } = input;

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new Error('User not found');
    }

    const property = await prisma.property.findUnique({
        where: { id: propertyId },
    });

    if (!property) {
        throw new Error('Property not found');
    }

    const room = await prisma.room.findFirst({
        where: {
            id: roomId,
            propertyId,
            deletedAt: null,
        },
    });

    if (!room) {
        throw new Error('Room not found or does not belong to this property');
    }

    if (guestsCount > room.maxGuests) {
        throw new Error(
            `Room can only accommodate ${room.maxGuests} guests. You requested ${guestsCount} guests.`
        );
    }

    const isAvailable = await checkRoomAvailability(
        roomId,
        checkInDate,
        checkOutDate
    );

    if (!isAvailable) {
        throw new Error('Room is not available for the selected dates');
    }

    const pricing = await calculateBookingPrice(
        roomId,
        checkInDate,
        checkOutDate,
        nights
    );

    const initialStatus =
        paymentMethod === 'PAYMENT_GATEWAY'
            ? BookingStatus.WAITING_PAYMENT
            : BookingStatus.WAITING_CONFIRMATION;

    const paymentDueAt = new Date();
    paymentDueAt.setHours(paymentDueAt.getHours() + 24);

    const booking = await prisma.$transaction(async (tx) => {
        const newBooking = await tx.booking.create({
            data: {
                userId,
                propertyId,
                roomId,
                checkInDate,
                checkOutDate,
                nights,
                guestsCount,
                status: initialStatus,
                nightlySubtotalIdr: pricing.nightlySubtotalIdr,
                cleaningFeeIdr: pricing.cleaningFeeIdr,
                serviceFeeIdr: pricing.serviceFeeIdr,
                discountIdr: pricing.discountIdr,
                totalPriceIdr: pricing.totalPriceIdr,
                paymentDueAt,
                nightlyRates: {
                    create: pricing.nightlyRates.map((rate) => ({
                        date: rate.date,
                        pricePerNightIdr: rate.pricePerNightIdr,
                    })),
                },
            },
            include: {
                property: {
                    include: {
                        location: true,
                    },
                },
                room: true,
                nightlyRates: true,
            },
        });

        await tx.payment.create({
            data: {
                bookingId: newBooking.id,
                userId,
                amountIdr: pricing.totalPriceIdr,
                paymentStatus: PaymentStatus.PENDING,
                paymentMethod,
            },
        });

        return newBooking;
    });

    let paymentToken = null;
    let paymentUrl = null;

    if (paymentMethod === 'PAYMENT_GATEWAY') {
        try {
            const midtransPayment = await createMidtransPayment({
                bookingId: booking.id,
                amount: pricing.totalPriceIdr,
                customerName: user.fullName,
                customerEmail: user.email,
            });

            paymentToken = midtransPayment.token;
            paymentUrl = midtransPayment.redirect_url;
        } catch (error: any) {
            // Midtrans payment error handled silently
        }
    }

    const bookingDetails = await getBookingByIdService(booking.id);

    return {
        ...bookingDetails,
        paymentToken,
        paymentUrl,
    };
}

export async function getBookingByIdService(
    bookingId: string
): Promise<BookingDetailsResponse> {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            property: {
                include: {
                    location: true,
                },
            },
            room: true,
            payments: {
                orderBy: {
                    requestedAt: 'desc',
                },
            },
        },
    });

    if (!booking) {
        throw new Error('Booking not found');
    }

    return {
        id: booking.id,
        userId: booking.userId,
        propertyId: booking.propertyId,
        roomId: booking.roomId,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        nights: booking.nights,
        guestsCount: booking.guestsCount,
        status: booking.status,
        nightlySubtotalIdr: booking.nightlySubtotalIdr,
        cleaningFeeIdr: booking.cleaningFeeIdr,
        serviceFeeIdr: booking.serviceFeeIdr,
        discountIdr: booking.discountIdr,
        totalPriceIdr: booking.totalPriceIdr,
        createdAt: booking.createdAt,
        paymentDueAt: booking.paymentDueAt,
        property: {
            id: booking.property.id,
            title: booking.property.title,
            location: {
                city: booking.property.location.city,
                country: booking.property.location.country,
                address: booking.property.location.address,
            },
        },
        room: booking.room
            ? {
                  id: booking.room.id,
                  name: booking.room.name,
                  maxGuests: booking.room.maxGuests,
                  beds: booking.room.beds,
                  bathrooms: booking.room.bathrooms,
              }
            : null,
        payments: booking.payments.map((payment) => ({
            id: payment.id,
            amountIdr: payment.amountIdr,
            paymentStatus: payment.paymentStatus,
            paymentMethod: payment.paymentMethod,
            paidAt: payment.paidAt,
        })),
    };
}

export async function getUserBookingsService(userId: string) {
    const bookings = await prisma.booking.findMany({
        where: {
            userId,
            deletedAt: null,
        },
        include: {
            property: {
                include: {
                    location: true,
                    images: {
                        take: 1,
                    },
                },
            },
            room: true,
            payments: {
                orderBy: {
                    requestedAt: 'desc',
                },
                take: 1,
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return bookings;
}

export async function processPaymentGatewayWebhook(
    transactionId: string,
    status: 'success' | 'pending' | 'failed',
    amount: number
) {
    const payment = await prisma.payment.findFirst({
        where: {
            providerTxId: transactionId,
        },
        include: {
            booking: true,
        },
    });

    if (!payment) {
        throw new Error('Payment not found');
    }

    if (payment.amountIdr !== amount) {
        throw new Error('Payment amount mismatch');
    }

    if (status === 'success') {
        await prisma.$transaction(async (tx) => {
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    paymentStatus: PaymentStatus.SUCCESS,
                    paidAt: new Date(),
                },
            });

            await tx.booking.update({
                where: { id: payment.bookingId },
                data: {
                    status: BookingStatus.CONFIRMED,
                },
            });

            await tx.emailNotification.create({
                data: {
                    bookingId: payment.bookingId,
                    type: 'BOOKING_CONFIRMED',
                    recipientEmail: '', 
                    payloadJson: JSON.stringify({
                        bookingId: payment.bookingId,
                        confirmedAt: new Date(),
                    }),
                },
            });
        });
    } else if (status === 'failed') {
        await prisma.$transaction(async (tx) => {
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    paymentStatus: PaymentStatus.FAILED,
                    failedAt: new Date(),
                },
            });

            const successfulPayments = await tx.payment.count({
                where: {
                    bookingId: payment.bookingId,
                    paymentStatus: PaymentStatus.SUCCESS,
                },
            });

            if (successfulPayments === 0) {
                await tx.booking.update({
                    where: { id: payment.bookingId },
                    data: {
                        status: BookingStatus.EXPIRED,
                    },
                });
            }
        });
    }

    return await getBookingByIdService(payment.bookingId);
}


export async function cancelBookingService(
    bookingId: string,
    userId: string,
    cancelReason?: string
) {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
    });

    if (!booking) {
        throw new Error('Booking not found');
    }

    if (booking.userId !== userId) {
        throw new Error('Unauthorized to cancel this booking');
    }

    if (booking.status === BookingStatus.CANCELED) {
        throw new Error('Booking is already canceled');
    }

    if (
        booking.status === BookingStatus.CHECKED_IN ||
        booking.status === BookingStatus.CHECKED_OUT
    ) {
        throw new Error('Cannot cancel a booking that has already started or completed');
    }

    const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
            status: BookingStatus.CANCELED,
            cancelledAt: new Date(),
            cancelReason: cancelReason || 'Canceled by user',
        },
        include: {
            property: {
                include: {
                    location: true,
                },
            },
            room: true,
            payments: true,
        },
    });

    return updatedBooking;
}


export async function calculateBookingPriceService(
    roomId: string,
    checkInDate: string,
    checkOutDate: string
): Promise<BookingPriceBreakdown> {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkIn >= checkOut) {
        throw new Error('Check-out date must be after check-in date');
    }

    const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    return await calculateBookingPrice(roomId, checkIn, checkOut, nights);
}
