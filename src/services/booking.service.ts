import prisma from '../config/prisma-client';
import { BookingStatus, PaymentStatus } from '../generated/prisma';
import {
    CreateBookingInput,
    BookingPriceBreakdown,
    RoomAvailabilityQuery,
    AvailableRoom,
    BookingDetailsResponse,
} from '../types/booking.types';

/**
 * Check if a room is available for the specified date range
 * Prevents overlapping bookings
 */
export async function checkRoomAvailability(
    roomId: string,
    checkInDate: Date,
    checkOutDate: Date,
    excludeBookingId?: string
): Promise<boolean> {
    // Find any overlapping bookings that are not canceled or expired
    const overlappingBookings = await prisma.booking.findMany({
        where: {
            roomId,
            status: {
                notIn: [BookingStatus.CANCELED, BookingStatus.EXPIRED],
            },
            deletedAt: null,
            ...(excludeBookingId && { id: { not: excludeBookingId } }),
            OR: [
                // Case 1: New booking starts during existing booking
                {
                    checkInDate: { lte: checkInDate },
                    checkOutDate: { gt: checkInDate },
                },
                // Case 2: New booking ends during existing booking
                {
                    checkInDate: { lt: checkOutDate },
                    checkOutDate: { gte: checkOutDate },
                },
                // Case 3: New booking completely contains existing booking
                {
                    checkInDate: { gte: checkInDate },
                    checkOutDate: { lte: checkOutDate },
                },
            ],
        },
    });

    return overlappingBookings.length === 0;
}

/**
 * Get all available rooms for a property within a date range
 */
export async function getAvailableRoomsService({
    propertyId,
    checkInDate,
    checkOutDate,
    guestsCount,
}: RoomAvailabilityQuery): Promise<AvailableRoom[]> {
    // Validate dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkIn >= checkOut) {
        throw new Error('Check-out date must be after check-in date');
    }

    if (checkIn < new Date(new Date().setHours(0, 0, 0, 0))) {
        throw new Error('Check-in date cannot be in the past');
    }

    // Get all rooms for the property
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

    // Map rooms with availability status
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

/**
 * Calculate booking price breakdown
 */
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

    // Calculate price for each night
    let currentDate = new Date(checkInDate);
    for (let i = 0; i < nights; i++) {
        let priceForNight = room.basePricePerNightIdr;

        // Check for special pricing
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

    // Calculate additional fees
    const cleaningFeeIdr = Math.round(nightlySubtotalIdr * 0.05); // 5% cleaning fee
    const serviceFeeIdr = Math.round(nightlySubtotalIdr * 0.03); // 3% service fee
    const discountIdr = 0; // No discount for now

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

/**
 * Create a new booking
 */
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

    // Validate user exists
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new Error('User not found');
    }

    // Validate property exists
    const property = await prisma.property.findUnique({
        where: { id: propertyId },
    });

    if (!property) {
        throw new Error('Property not found');
    }

    // Validate room exists and belongs to property
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

    // Check if room can accommodate guests
    if (guestsCount > room.maxGuests) {
        throw new Error(
            `Room can only accommodate ${room.maxGuests} guests. You requested ${guestsCount} guests.`
        );
    }

    // Check room availability
    const isAvailable = await checkRoomAvailability(
        roomId,
        checkInDate,
        checkOutDate
    );

    if (!isAvailable) {
        throw new Error('Room is not available for the selected dates');
    }

    // Calculate pricing
    const pricing = await calculateBookingPrice(
        roomId,
        checkInDate,
        checkOutDate,
        nights
    );

    // Determine initial booking status based on payment method
    // For PAYMENT_GATEWAY, auto-confirm since it's an online payment
    // For BANK_TRANSFER, wait for admin confirmation
    const initialStatus =
        paymentMethod === 'PAYMENT_GATEWAY'
            ? BookingStatus.CONFIRMED
            : BookingStatus.WAITING_CONFIRMATION;

    // Set payment due date (24 hours from now for bank transfer, null for confirmed)
    const paymentDueAt = paymentMethod === 'BANK_TRANSFER' ? new Date() : null;
    if (paymentDueAt) {
        paymentDueAt.setHours(paymentDueAt.getHours() + 24);
    }

    // Create booking with payment in a transaction
    const booking = await prisma.$transaction(async (tx) => {
        // Create the booking
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

        // Create initial payment record
        // For PAYMENT_GATEWAY, mark as SUCCESS immediately
        // For BANK_TRANSFER, mark as PENDING waiting for confirmation
        await tx.payment.create({
            data: {
                bookingId: newBooking.id,
                userId,
                amountIdr: pricing.totalPriceIdr,
                paymentStatus: paymentMethod === 'PAYMENT_GATEWAY' ? PaymentStatus.SUCCESS : PaymentStatus.PENDING,
                paymentMethod,
                paidAt: paymentMethod === 'PAYMENT_GATEWAY' ? new Date() : null,
            },
        });

        return newBooking;
    });

    // Fetch complete booking details
    const bookingDetails = await getBookingByIdService(booking.id);

    return bookingDetails;
}

/**
 * Get booking by ID
 */
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

/**
 * Get user's bookings
 */
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

/**
 * Process payment gateway webhook
 * Auto-confirm booking if payment is successful
 */
export async function processPaymentGatewayWebhook(
    transactionId: string,
    status: 'success' | 'pending' | 'failed',
    amount: number
) {
    // Find payment by provider transaction ID
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

    // Verify amount matches
    if (payment.amountIdr !== amount) {
        throw new Error('Payment amount mismatch');
    }

    // Update payment and booking status based on webhook status
    if (status === 'success') {
        await prisma.$transaction(async (tx) => {
            // Update payment status
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    paymentStatus: PaymentStatus.SUCCESS,
                    paidAt: new Date(),
                },
            });

            // Auto-confirm booking
            await tx.booking.update({
                where: { id: payment.bookingId },
                data: {
                    status: BookingStatus.CONFIRMED,
                },
            });

            // Create email notification record
            await tx.emailNotification.create({
                data: {
                    bookingId: payment.bookingId,
                    type: 'BOOKING_CONFIRMED',
                    recipientEmail: '', // Would be populated from user email
                    payloadJson: JSON.stringify({
                        bookingId: payment.bookingId,
                        confirmedAt: new Date(),
                    }),
                },
            });
        });
    } else if (status === 'failed') {
        await prisma.$transaction(async (tx) => {
            // Update payment status
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    paymentStatus: PaymentStatus.FAILED,
                    failedAt: new Date(),
                },
            });

            // Mark booking as expired if no other successful payment exists
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

/**
 * Cancel a booking
 */
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

/**
 * Calculate booking price (external-facing)
 */
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
