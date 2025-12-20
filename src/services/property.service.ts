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
    maxGuests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    minNights: number;
    maxNights: number;
    basePricePerNightIdr: number;
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
    maxGuests?: number;
    bedrooms?: number;
    beds?: number;
    bathrooms?: number;
    minNights?: number;
    maxNights?: number;
    basePricePerNightIdr?: number;
    status?: PropertyStatus;
}

interface GetPropertiesFilters {
    status?: PropertyStatus;
    locationId?: string;
    typeId?: string;
    adminUserId?: string;
    minPrice?: number;
    maxPrice?: number;
    minGuests?: number;
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
    maxGuests, 
    bedrooms, 
    beds, 
    bathrooms, 
    minNights, 
    maxNights, 
    basePricePerNightIdr, 
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
                    maxGuests: Number(maxGuests) || 1,
                    bedrooms: Number(bedrooms) || 0,
                    beds: Number(beds) || 0,
                    bathrooms: Number(bathrooms) || 0,
                    minNights: Number(minNights) || 1,
                    maxNights: Number(maxNights) || 30,
                    basePricePerNightIdr: Number(basePricePerNightIdr) || 0,
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
        console.error('Error creating property:', error);
        
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
        where.basePricePerNightIdr = {};
        if (filters.minPrice !== undefined) {
            where.basePricePerNightIdr.gte = filters.minPrice;
        }
        if (filters.maxPrice !== undefined) {
            where.basePricePerNightIdr.lte = filters.maxPrice;
        }
    }

    if (filters?.minGuests !== undefined) {
        where.maxGuests = {
            gte: filters.minGuests,
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
    } else if (filters?.sortBy === 'price') {
        orderBy = { basePricePerNightIdr: filters.sortOrder || 'asc' };
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
        let minPrice = property.basePricePerNightIdr;
        
        if (property.rooms && property.rooms.length > 0) {
            const roomPrices = property.rooms.map(room => room.basePricePerNightIdr);
            const minRoomPrice = Math.min(...roomPrices);
            minPrice = minRoomPrice > 0 ? minRoomPrice : property.basePricePerNightIdr;
        }

        return {
            ...property,
            minPricePerNight: minPrice,
        };
    });

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
    });

    if (!existingProperty) {
        throw new Error('Property not found');
    }

    if (adminUserId && existingProperty.adminUserId !== adminUserId) {
        throw new Error('You do not have permission to update this property');
    }

    try {
        const updateData: any = {
            updatedAt: new Date(),
        };

        if (data.title !== undefined) updateData.title = data.title.trim();
        if (data.description !== undefined) updateData.description = data.description?.trim() || null;
        if (data.typeId !== undefined) updateData.typeId = data.typeId || null;
        if (data.locationId !== undefined) updateData.locationId = data.locationId;
        if (data.maxGuests !== undefined) updateData.maxGuests = data.maxGuests;
        if (data.bedrooms !== undefined) updateData.bedrooms = data.bedrooms;
        if (data.beds !== undefined) updateData.beds = data.beds;
        if (data.bathrooms !== undefined) updateData.bathrooms = data.bathrooms;
        if (data.minNights !== undefined) updateData.minNights = data.minNights;
        if (data.maxNights !== undefined) updateData.maxNights = data.maxNights;
        if (data.basePricePerNightIdr !== undefined) updateData.basePricePerNightIdr = data.basePricePerNightIdr;
        if (data.status !== undefined) updateData.status = data.status;

        const updatedProperty = await prisma.property.update({
            where: { id },
            data: updateData,
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
            },
        });

        return updatedProperty;
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
