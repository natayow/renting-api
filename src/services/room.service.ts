import prisma from '../config/prisma-client';
import { Room } from '../generated/prisma';

interface CreateRoomInput {
    propertyId: string;
    name: string;
    description?: string | null;
    maxGuests: number;
    beds: number;
    bathrooms: number;
    basePricePerNightIdr: number;
    facilityIds?: string[];
}

interface UpdateRoomInput {
    name?: string;
    description?: string | null;
    maxGuests?: number;
    beds?: number;
    bathrooms?: number;
    basePricePerNightIdr?: number;
    facilityIds?: string[];
}

export async function createRoomService({ 
    propertyId, 
    name, 
    description, 
    maxGuests, 
    beds, 
    bathrooms, 
    basePricePerNightIdr,
    facilityIds 
}: CreateRoomInput) {
    const property = await prisma.property.findUnique({
        where: { id: propertyId },
    });

    if (!property) {
        throw new Error('Property not found');
    }

    if (facilityIds && facilityIds.length > 0) {
        const facilities = await prisma.facility.findMany({
            where: {
                id: { in: facilityIds },
                deletedAt: null,
            },
        });

        if (facilities.length !== facilityIds.length) {
            throw new Error('One or more facilities not found');
        }
    }

    try {
        const newRoom = await prisma.room.create({
            data: {
                property: {
                    connect: { id: propertyId }
                },
                name: name.trim(),
                description: description?.trim() || null,
                maxGuests: Number(maxGuests) || 1,
                beds: Number(beds) || 1,
                bathrooms: Number(bathrooms) || 1,
                basePricePerNightIdr: Number(basePricePerNightIdr) || 0,
                ...(facilityIds && facilityIds.length > 0 && {
                    facilities: {
                        create: facilityIds.map(facilityId => ({
                            facility: {
                                connect: { id: facilityId }
                            }
                        }))
                    }
                }),
            },
            include: {
                property: {
                    select: {
                        id: true,
                        title: true,
                    }
                },
                facilities: {
                    include: {
                        facility: true,
                    }
                },
            },
        });

        return newRoom;
    } catch (error: any) {
        throw error;
    }
}

export async function getAllRoomsService() {
    const rooms = await prisma.room.findMany({
        where: {
            deletedAt: null,
        },
        include: {
            property: {
                select: {
                    id: true,
                    title: true,
                }
            },
            facilities: {
                include: {
                    facility: true,
                }
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return rooms;
}

export async function getRoomsByPropertyService(propertyId: string) {
    const rooms = await prisma.room.findMany({
        where: {
            propertyId,
            deletedAt: null,
        },
        include: {
            facilities: {
                include: {
                    facility: true,
                }
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return rooms;
}

export async function getRoomByIdService(id: string) {
    const room = await prisma.room.findFirst({
        where: {
            id,
            deletedAt: null,
        },
        include: {
            property: {
                select: {
                    id: true,
                    title: true,
                    adminUserId: true,
                }
            },
            facilities: {
                include: {
                    facility: true,
                }
            },
        },
    });

    return room;
}

export async function updateRoomService(id: string, updateData: UpdateRoomInput) {
    const existingRoom = await prisma.room.findFirst({
        where: {
            id,
            deletedAt: null,
        },
    });

    if (!existingRoom) {
        throw new Error('Room not found');
    }

    if (updateData.facilityIds && updateData.facilityIds.length > 0) {
        const facilities = await prisma.facility.findMany({
            where: {
                id: { in: updateData.facilityIds },
                deletedAt: null,
            },
        });

        if (facilities.length !== updateData.facilityIds.length) {
            throw new Error('One or more facilities not found');
        }
    }

    try {
        const updatedRoom = await prisma.$transaction(async (tx) => {
            if (updateData.facilityIds !== undefined) {
                await tx.roomFacility.deleteMany({
                    where: { roomId: id },
                });

                if (updateData.facilityIds.length > 0) {
                    await tx.roomFacility.createMany({
                        data: updateData.facilityIds.map(facilityId => ({
                            roomId: id,
                            facilityId,
                        })),
                    });
                }
            }

            const room = await tx.room.update({
                where: { id },
                data: {
                    ...(updateData.name && { name: updateData.name.trim() }),
                    ...(updateData.description !== undefined && { 
                        description: updateData.description?.trim() || null 
                    }),
                    ...(updateData.maxGuests !== undefined && { 
                        maxGuests: Number(updateData.maxGuests) 
                    }),
                    ...(updateData.beds !== undefined && { 
                        beds: Number(updateData.beds) 
                    }),
                    ...(updateData.bathrooms !== undefined && { 
                        bathrooms: Number(updateData.bathrooms) 
                    }),
                    ...(updateData.basePricePerNightIdr !== undefined && { 
                        basePricePerNightIdr: Number(updateData.basePricePerNightIdr) 
                    }),
                    updatedAt: new Date(),
                },
                include: {
                    property: {
                        select: {
                            id: true,
                            title: true,
                        }
                    },
                    facilities: {
                        include: {
                            facility: true,
                        }
                    },
                },
            });

            return room;
        });

        return updatedRoom;
    } catch (error: any) {
        throw error;
    }
}

export async function deleteRoomService(id: string) {
    const existingRoom = await prisma.room.findFirst({
        where: {
            id,
            deletedAt: null,
        },
    });

    if (!existingRoom) {
        throw new Error('Room not found');
    }

    const bookingsCount = await prisma.booking.count({
        where: {
            roomId: id,
            status: {
                in: ['WAITING_PAYMENT', 'WAITING_CONFIRMATION', 'CONFIRMED'],
            },
        },
    });

    if (bookingsCount > 0) {
        throw new Error('Cannot delete room with active bookings');
    }

    const deletedRoom = await prisma.room.update({
        where: { id },
        data: {
            deletedAt: new Date(),
        },
    });

    return deletedRoom;
}

export async function getRoomAvailabilityService(roomId: string, startDate?: Date, endDate?: Date) {
    const whereClause: any = {
        roomId,
        deletedAt: null,
    };

    if (startDate && endDate) {
        whereClause.date = {
            gte: startDate,
            lte: endDate,
        };
    }

    const availability = await prisma.roomAvailability.findMany({
        where: whereClause,
        orderBy: {
            date: 'asc',
        },
    });

    return availability;
}

export async function updateRoomAvailabilityService(roomId: string, date: Date, isAvailable: boolean) {
    const room = await prisma.room.findFirst({
        where: { id: roomId, deletedAt: null },
    });

    if (!room) {
        throw new Error('Room not found');
    }

    const availability = await prisma.roomAvailability.upsert({
        where: {
            roomId_date: {
                roomId,
                date,
            },
        },
        update: {
            isAvailable,
            updatedAt: new Date(),
        },
        create: {
            roomId,
            date,
            isAvailable,
        },
    });

    return availability;
}

export async function bulkUpdateRoomAvailabilityService(
    roomId: string, 
    dates: { date: Date; isAvailable: boolean }[]
) {
    const room = await prisma.room.findFirst({
        where: { id: roomId, deletedAt: null },
    });

    if (!room) {
        throw new Error('Room not found');
    }

    const results = await prisma.$transaction(
        dates.map(({ date, isAvailable }) =>
            prisma.roomAvailability.upsert({
                where: {
                    roomId_date: {
                        roomId,
                        date,
                    },
                },
                update: {
                    isAvailable,
                    updatedAt: new Date(),
                },
                create: {
                    roomId,
                    date,
                    isAvailable,
                },
            })
        )
    );

    return results;
}

export async function getPeakSeasonRatesService(roomId: string, includeInactive: boolean = false) {
    const whereClause: any = {
        roomId,
        deletedAt: null,
    };

    if (!includeInactive) {
        whereClause.isActive = true;
    }

    const peakSeasonRates = await prisma.roomPeakSeasonRate.findMany({
        where: whereClause,
        orderBy: {
            startDate: 'asc',
        },
    });

    return peakSeasonRates;
}

export async function createPeakSeasonRateService(data: {
    roomId: string;
    startDate: Date;
    endDate: Date;
    adjustmentType: 'FIXED' | 'PERCENTAGE';
    adjustmentValue: number;
    note?: string;
}) {
    const room = await prisma.room.findFirst({
        where: { id: data.roomId, deletedAt: null },
    });

    if (!room) {
        throw new Error('Room not found');
    }

    if (data.startDate > data.endDate) {
        throw new Error('Start date must be before or equal to end date');
    }

    if (data.adjustmentType === 'PERCENTAGE' && (data.adjustmentValue < 0 || data.adjustmentValue > 1000)) {
        throw new Error('Percentage adjustment must be between 0 and 1000');
    }

    if (data.adjustmentType === 'FIXED' && data.adjustmentValue < 0) {
        throw new Error('Fixed adjustment must be a positive value');
    }

    const peakSeasonRate = await prisma.roomPeakSeasonRate.create({
        data: {
            roomId: data.roomId,
            startDate: data.startDate,
            endDate: data.endDate,
            adjustmentType: data.adjustmentType,
            adjustmentValue: data.adjustmentValue,
            note: data.note || null,
        },
    });

    return peakSeasonRate;
}

export async function bulkCreatePeakSeasonRatesService(
    roomId: string,
    rates: Array<{
        startDate: Date;
        endDate: Date;
        adjustmentType: 'FIXED' | 'PERCENTAGE';
        adjustmentValue: number;
        note?: string;
    }>
) {
    const room = await prisma.room.findFirst({
        where: { id: roomId, deletedAt: null },
    });

    if (!room) {
        throw new Error('Room not found');
    }

    for (const rate of rates) {
        if (rate.startDate > rate.endDate) {
            throw new Error('Start date must be before or equal to end date');
        }
        if (rate.adjustmentType === 'PERCENTAGE' && (rate.adjustmentValue < 0 || rate.adjustmentValue > 1000)) {
            throw new Error('Percentage adjustment must be between 0 and 1000');
        }
        if (rate.adjustmentType === 'FIXED' && rate.adjustmentValue < 0) {
            throw new Error('Fixed adjustment must be a positive value');
        }
    }

    const results = await prisma.roomPeakSeasonRate.createMany({
        data: rates.map(rate => ({
            roomId,
            startDate: rate.startDate,
            endDate: rate.endDate,
            adjustmentType: rate.adjustmentType,
            adjustmentValue: rate.adjustmentValue,
            note: rate.note || null,
        })),
    });

    return results;
}

export async function updatePeakSeasonRateService(
    id: string,
    data: {
        startDate?: Date;
        endDate?: Date;
        adjustmentType?: 'FIXED' | 'PERCENTAGE';
        adjustmentValue?: number;
        note?: string;
        isActive?: boolean;
    }
) {
    const existingRate = await prisma.roomPeakSeasonRate.findFirst({
        where: { id, deletedAt: null },
    });

    if (!existingRate) {
        throw new Error('Peak season rate not found');
    }

    const startDate = data.startDate || existingRate.startDate;
    const endDate = data.endDate || existingRate.endDate;

    if (startDate > endDate) {
        throw new Error('Start date must be before or equal to end date');
    }

    if (data.adjustmentType === 'PERCENTAGE' && data.adjustmentValue !== undefined) {
        if (data.adjustmentValue < 0 || data.adjustmentValue > 1000) {
            throw new Error('Percentage adjustment must be between 0 and 1000');
        }
    }

    if (data.adjustmentType === 'FIXED' && data.adjustmentValue !== undefined) {
        if (data.adjustmentValue < 0) {
            throw new Error('Fixed adjustment must be a positive value');
        }
    }

    const updatedRate = await prisma.roomPeakSeasonRate.update({
        where: { id },
        data: {
            ...(data.startDate && { startDate: data.startDate }),
            ...(data.endDate && { endDate: data.endDate }),
            ...(data.adjustmentType && { adjustmentType: data.adjustmentType }),
            ...(data.adjustmentValue !== undefined && { adjustmentValue: data.adjustmentValue }),
            ...(data.note !== undefined && { note: data.note }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
            updatedAt: new Date(),
        },
    });

    return updatedRate;
}

export async function deletePeakSeasonRateService(id: string) {
    const existingRate = await prisma.roomPeakSeasonRate.findFirst({
        where: { id, deletedAt: null },
    });

    if (!existingRate) {
        throw new Error('Peak season rate not found');
    }

    const deletedRate = await prisma.roomPeakSeasonRate.update({
        where: { id },
        data: {
            deletedAt: new Date(),
        },
    });

    return deletedRate;
}

