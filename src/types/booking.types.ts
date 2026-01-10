import { BookingStatus, PaymentStatus } from '../generated/prisma';

export interface CreateBookingInput {
    userId: string;
    propertyId: string;
    roomId: string;
    checkInDate: Date;
    checkOutDate: Date;
    nights: number;
    guestsCount: number;
    paymentMethod: 'BANK_TRANSFER' | 'PAYMENT_GATEWAY';
}

export interface BookingPriceBreakdown {
    nightlySubtotalIdr: number;
    cleaningFeeIdr: number;
    serviceFeeIdr: number;
    discountIdr: number;
    totalPriceIdr: number;
    nightlyRates: Array<{
        date: Date;
        pricePerNightIdr: number;
    }>;
}

export interface RoomAvailabilityQuery {
    propertyId: string;
    checkInDate: Date;
    checkOutDate: Date;
    guestsCount?: number;
}

export interface AvailableRoom {
    id: string;
    name: string;
    description: string | null;
    maxGuests: number;
    beds: number;
    bathrooms: number;
    basePricePerNightIdr: number;
    isAvailable: boolean;
    facilities: Array<{
        id: string;
        name: string;
        icon: string | null;
    }>;
}

export interface PaymentGatewayWebhookPayload {
    orderId: string;
    transactionId: string;
    status: 'success' | 'pending' | 'failed';
    amount: number;
    paymentMethod: string;
    timestamp: string;
    signature: string;
}

export interface BookingDetailsResponse {
    id: string;
    userId: string;
    propertyId: string;
    roomId: string | null;
    checkInDate: Date;
    checkOutDate: Date;
    nights: number;
    guestsCount: number;
    status: BookingStatus;
    nightlySubtotalIdr: number;
    cleaningFeeIdr: number;
    serviceFeeIdr: number;
    discountIdr: number;
    totalPriceIdr: number;
    createdAt: Date;
    paymentDueAt: Date | null;
    property: {
        id: string;
        title: string;
        location: {
            city: string;
            country: string;
            address: string;
        };
    };
    room: {
        id: string;
        name: string;
        maxGuests: number;
        beds: number;
        bathrooms: number;
    } | null;
    payments: Array<{
        id: string;
        amountIdr: number;
        paymentStatus: PaymentStatus;
        paymentMethod: string | null;
        paidAt: Date | null;
    }>;
}
