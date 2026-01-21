import prisma from '../config/prisma-client';
import { Property, PropertyStatus } from '../generated/prisma';

interface RoomInput {
    name: string;
    description?: string;
    maxGuests: number;
    beds: number;
    bathrooms: number;
    basePricePerNightIdr: number;
}

interface CreatePropertyInput {
    adminUserId: string;
    title: string;
    description?: string | null;
    typeId?: string | null;
    city: string;
    country: string;
    address: string;
    status: PropertyStatus;
    files: Express.Multer.File[];
    facilityIds?: string[];
    rooms?: RoomInput[];
}


interface UpdatePropertyInput {
    title?: string;
    description?: string;
    typeId?: string;
    locationId?: string;
    city?: string;
    country?: string;
    address?: string;
    status?: PropertyStatus;
    facilityIds?: string[];
}

interface GetPropertiesFilters {
    status?: PropertyStatus;
    locationId?: string;
    typeId?: string;
    adminUserId?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'price';
    sortOrder?: 'asc' | 'desc';
}

export async function createPropertyService({ 
    adminUserId, 
    title, 
    description, 
    typeId, 
    city, 
    country, 
    address, 
    status, 
    files,
    facilityIds,
    rooms
}: CreatePropertyInput) {
    try {
        return await prisma.$transaction(async (tx) => {
            const newLocation = await tx.location.create({
                data: {
                    city,
                    country,
                    address,
                },
            });

            const newProperty = await tx.property.create({
                data: {
                    adminUser: {
                        connect: { id: adminUserId }
                    },
                    location: {
                        connect: { id: newLocation.id }
                    },
                    ...(typeId && {
                        type: {
                            connect: { id: typeId }
                        }
                    }),
                    title,
                    description,
                    status: status || 'DRAFT',
                },
            });

            if (files && files.length > 0) {
                const newFiles = files.map((file) => {
                    return { url: file?.filename, propertyId: newProperty.id };
                });

                await tx.propertyImage.createMany({
                    data: newFiles,
                });
            }

            if (facilityIds && facilityIds.length > 0) {
                const facilityData = facilityIds.map((facilityId) => ({
                    propertyId: newProperty.id,
                    facilityId: facilityId,
                }));

                await tx.propertyFacility.createMany({
                    data: facilityData,
                });
            }

            if (rooms && rooms.length > 0) {
                const roomData = rooms.map((room) => ({
                    propertyId: newProperty.id,
                    name: room.name,
                    description: room.description || null,
                    maxGuests: Number(room.maxGuests) || 1,
                    beds: Number(room.beds) || 1,
                    bathrooms: Number(room.bathrooms) || 1,
                    basePricePerNightIdr: Number(room.basePricePerNightIdr) || 0,
                }));

                await tx.room.createMany({
                    data: roomData,
                });
            }

            const completeProperty = await tx.property.findUnique({
                where: { id: newProperty.id },
                include: {
                    adminUser: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            role: true,
                        },
                    },
                    type: true,
                    location: true,
                    images: true,
                    facilities: {
                        include: {
                            facility: true,
                        },
                    },
                    rooms: true,
                },
            });

            return completeProperty;
        });
    } catch (error: any) {
        if (error.code === 'P2003') {
            throw new Error('Invalid reference: Admin user, location, or property type not found');
        }
        if (error.code === 'P2002') {
            throw new Error('A property with this information already exists');
        }
        
        throw error;
    }
}

export async function getAllPropertiesService(filters?: GetPropertiesFilters) {
    const where: any = {
        deletedAt: null,
    };

    if (filters?.status) {
        where.status = filters.status;
    }

    if (filters?.locationId) {
        where.locationId = filters.locationId;
    }

    if (filters?.typeId) {
        where.typeId = filters.typeId;
    }

    if (filters?.adminUserId) {
        where.adminUserId = filters.adminUserId;
    }

    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
        where.rooms = {
            some: {
                basePricePerNightIdr: {
                    ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
                    ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
                },
            },
        };
    }

    if (filters?.search) {
        where.OR = [
            {
                title: {
                    contains: filters.search,
                    mode: 'insensitive',
                },
            },
            {
                location: {
                    city: {
                        contains: filters.search,
                        mode: 'insensitive',
                    },
                },
            },
            {
                location: {
                    address: {
                        contains: filters.search,
                        mode: 'insensitive',
                    },
                },
            },
        ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 12;
    const skip = (page - 1) * limit;

    let orderBy: any = { createdAt: 'desc' };
    if (filters?.sortBy === 'name') {
        orderBy = { title: filters.sortOrder || 'asc' };
    }

    const total = await prisma.property.count({ where });

    const properties = await prisma.property.findMany({
        where,
        include: {
            adminUser: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                },
            },
            type: true,
            location: true,
            images: {
                where: { deletedAt: null },
                orderBy: { createdAt: 'asc' },
            },
            facilities: {
                include: {
                    facility: true,
                },
                where: {
                    facility: {
                        deletedAt: null,
                    },
                },
            },
            rooms: {
                where: { deletedAt: null },
                select: {
                    id: true,
                    basePricePerNightIdr: true,
                },
            },
        },
        orderBy,
        skip,
        take: limit,
    });

    const propertiesWithMinPrice = properties.map(property => {
        let minPrice = 0;
        
        if (property.rooms && property.rooms.length > 0) {
            const roomPrices = property.rooms.map(room => room.basePricePerNightIdr);
            minPrice = Math.min(...roomPrices);
        }

        return {
            ...property,
            minPricePerNight: minPrice,
        };
    });

    if (filters?.sortBy === 'price') {
        propertiesWithMinPrice.sort((a, b) => {
            const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;
            return (a.minPricePerNight - b.minPricePerNight) * sortOrder;
        });
    }

    return {
        data: propertiesWithMinPrice,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export async function getPropertyByIdService(id: string) {
    const property = await prisma.property.findFirst({
        where: {
            id,
            deletedAt: null,
        },
        include: {
            adminUser: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                },
            },
            type: true,
            location: true,
            images: {
                where: { deletedAt: null },
                orderBy: { createdAt: 'asc' },
            },
            facilities: {
                include: {
                    facility: true,
                },
                where: {
                    facility: {
                        deletedAt: null,
                    },
                },
            },
            rooms: {
                where: { deletedAt: null },
                include: {
                    facilities: {
                        include: {
                            facility: true,
                        },
                    },
                },
            },
            specialPrices: {
                where: { deletedAt: null },
                orderBy: { startDate: 'asc' },
            },
        },
    });

    return property;
}

export async function updatePropertyService(id: string, data: UpdatePropertyInput, adminUserId?: string) {
    const existingProperty = await prisma.property.findFirst({
        where: {
            id,
            deletedAt: null,
        },
        include: {
            location: true,
        },
    });

    if (!existingProperty) {
        throw new Error('Property not found');
    }

    if (adminUserId && existingProperty.adminUserId !== adminUserId) {
        throw new Error('You do not have permission to update this property');
    }

    try {
        return await prisma.$transaction(async (tx) => {
            if (data.city || data.country || data.address) {
                await tx.location.update({
                    where: { id: existingProperty.locationId },
                    data: {
                        ...(data.city && { city: data.city }),
                        ...(data.country && { country: data.country }),
                        ...(data.address && { address: data.address }),
                        updatedAt: new Date(),
                    },
                });
            }

            const updateData: any = {
                updatedAt: new Date(),
            };

            if (data.title !== undefined) updateData.title = data.title.trim();
            if (data.description !== undefined) updateData.description = data.description?.trim() || null;
            if (data.typeId !== undefined) updateData.typeId = data.typeId || null;
            if (data.locationId !== undefined) updateData.locationId = data.locationId;
            if (data.status !== undefined) updateData.status = data.status;

            const updatedProperty = await tx.property.update({
                where: { id },
                data: updateData,
            });

            if (data.facilityIds !== undefined) {
                await tx.propertyFacility.deleteMany({
                    where: { propertyId: id },
                });

                if (data.facilityIds.length > 0) {
                    await tx.propertyFacility.createMany({
                        data: data.facilityIds.map(facilityId => ({
                            propertyId: id,
                            facilityId,
                        })),
                    });
                }
            }

            const completeProperty = await tx.property.findUnique({
                where: { id },
                include: {
                    adminUser: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            role: true,
                        },
                    },
                    type: true,
                    location: true,
                    images: {
                        where: { deletedAt: null },
                    },
                    facilities: {
                        include: {
                            facility: true,
                        },
                    },
                },
            });

            return completeProperty;
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            throw new Error('Property not found');
        }
        if (error.code === 'P2003') {
            throw new Error('Invalid foreign key reference');
        }
        throw error;
    }
}

export async function deletePropertyService(id: string, adminUserId?: string) {
    const existingProperty = await prisma.property.findFirst({
        where: {
            id,
            deletedAt: null,
        },
    });

    if (!existingProperty) {
        throw new Error('Property not found');
    }

    if (adminUserId && existingProperty.adminUserId !== adminUserId) {
        throw new Error('You do not have permission to delete this property');
    }

    try {
        const deletedProperty = await prisma.property.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });

        return deletedProperty;
    } catch (error: any) {
        if (error.code === 'P2025') {
            throw new Error('Property not found');
        }
        throw error;
    }
}

export async function getPropertiesByAdminService(adminUserId: string) {
    const properties = await prisma.property.findMany({
        where: {
            adminUserId,
            deletedAt: null,
        },
        include: {
            type: true,
            location: true,
            images: {
                where: { deletedAt: null },
                orderBy: { createdAt: 'asc' },
            },
            facilities: {
                include: {
                    facility: true,
                },
            },
            rooms: {
                where: { deletedAt: null },
                orderBy: { createdAt: 'asc' },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return properties;
}

export async function updatePropertyStatusService(id: string, status: PropertyStatus, adminUserId?: string) {
    const existingProperty = await prisma.property.findFirst({
        where: {
            id,
            deletedAt: null,
        },
    });

    if (!existingProperty) {
        throw new Error('Property not found');
    }

    if (adminUserId && existingProperty.adminUserId !== adminUserId) {
        throw new Error('You do not have permission to update this property');
    }

    try {
        const updatedProperty = await prisma.property.update({
            where: { id },
            data: {
                status,
                updatedAt: new Date(),
            },
            include: {
                adminUser: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true,
                    },
                },
                type: true,
                location: true,
            },
        });

        return updatedProperty;
    } catch (error: any) {
        if (error.code === 'P2025') {
            throw new Error('Property not found');
        }
        throw error;
    }
}
