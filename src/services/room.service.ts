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
        console.error('Error creating room:', error);
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
        console.error('Error updating room:', error);
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
