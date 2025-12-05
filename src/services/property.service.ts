import prisma from '../config/prisma-client';
import { Property, PropertyStatus } from '../generated/prisma';

interface CreatePropertyInput extends Pick<Property,
    | 'adminUserId'
    | 'title'
    | 'description'
    | 'typeId'
    | 'locationId'
    | 'maxGuests'
    | 'bedrooms'
    | 'beds'
    | 'bathrooms'
    | 'minNights'
    | 'maxNights'
    | 'basePricePerNightIdr'
    | 'status'> {
    files: Express.Multer.File[];
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
}

export async function createPropertyService({ adminUserId, title, description, typeId, locationId, maxGuests, bedrooms, beds, bathrooms, minNights, maxNights, basePricePerNightIdr, status, files }: CreatePropertyInput) {
    // Validate required fields
    if (!adminUserId) {
        throw new Error('Admin user ID is required');
    }

    if (!title || title.trim() === '') {
        throw new Error('Title is required');
    }

    if (!locationId) {
        throw new Error('Location ID is required');
    }

    // Verify admin user exists and has ADMIN role
    const adminUser = await prisma.user.findUnique({
        where: { id: adminUserId },
    });

    if (!adminUser) {
        throw new Error('Admin user not found');
    }

    if (adminUser.role !== 'ADMIN') {
        throw new Error('User must have ADMIN role to create properties');
    }

    // Verify location exists
    const location = await prisma.location.findUnique({
        where: { id: locationId },
    });

    if (!location) {
        throw new Error('Location not found');
    }

    // Verify property type exists if provided
    if (typeId) {
        const propertyType = await prisma.propertyType.findUnique({
            where: { id: typeId },
        });

        if (!propertyType) {
            throw new Error('Property type not found');
        }
    }

    try {
        return await prisma.$transaction(async (tx) => {
            const newProperty = await tx.property.create({
                data: {
                    adminUser: {
                        connect: { id: adminUserId }
                    },
                    location: {
                        connect: { id: locationId }
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

            // Fetch the complete property with relations
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
                },
            });

            return completeProperty;
        });
    } catch (error: any) {
        console.error('Error creating property:', error);
        
        // Handle specific Prisma errors
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
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return properties;
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
    // Check if property exists
    const existingProperty = await prisma.property.findFirst({
        where: {
            id,
            deletedAt: null,
        },
    });

    if (!existingProperty) {
        throw new Error('Property not found');
    }

    // If adminUserId is provided, verify ownership
    if (adminUserId && existingProperty.adminUserId !== adminUserId) {
        throw new Error('You do not have permission to update this property');
    }

    // Verify location exists if provided
    if (data.locationId) {
        const location = await prisma.location.findFirst({
            where: {
                id: data.locationId,
                deletedAt: null,
            },
        });

        if (!location) {
            throw new Error('Location not found');
        }
    }

    // Verify property type exists if provided
    if (data.typeId) {
        const propertyType = await prisma.propertyType.findFirst({
            where: {
                id: data.typeId,
                deletedAt: null,
            },
        });

        if (!propertyType) {
            throw new Error('Property type not found');
        }
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

    // If adminUserId is provided, verify ownership
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

    // If adminUserId is provided, verify ownership
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
