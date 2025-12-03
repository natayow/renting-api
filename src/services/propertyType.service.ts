import prisma from '../config/prisma-client';
import { PropertyType } from '../generated/prisma';

export async function createPropertyTypeService({ name }: Pick<PropertyType, 'name'>) {
    if (!name || !name.trim()) {
        throw new Error('Property type name is required');
    }

    const normalizedName = name.trim();

    const existingPropertyType = await prisma.propertyType.findUnique({
        where: { name: normalizedName }
    });

    if (existingPropertyType) {
        throw new Error('Property type with this name already exists');
    }

    try {
        const newPropertyType = await prisma.propertyType.create({
            data: {
                name: normalizedName,
            },
        });

        return newPropertyType;
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new Error('Property type with this name already exists');
        }
        throw error;
    }
}

export async function getAllPropertyTypesService() {
    const propertyTypes = await prisma.propertyType.findMany({
        where: {
            deletedAt: null, 
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return propertyTypes;
}

export async function getPropertyTypeByIdService(id: string) {
    const propertyType = await prisma.propertyType.findFirst({
        where: {
            id,
            deletedAt: null,
        },
    });

    return propertyType;
}

export async function updatePropertyTypeService(id: string, { name }: Pick<PropertyType, 'name'>) {
    if (!name || !name.trim()) {
        throw new Error('Property type name is required');
    }

    const normalizedName = name.trim();

    const existingPropertyType = await prisma.propertyType.findFirst({
        where: {
            id,
            deletedAt: null,
        },
    });

    if (!existingPropertyType) {
        throw new Error('Property type not found');
    }

    const duplicatePropertyType = await prisma.propertyType.findFirst({
        where: {
            name: normalizedName,
            id: { not: id },
            deletedAt: null,
        },
    });

    if (duplicatePropertyType) {
        throw new Error('Property type with this name already exists');
    }

    try {
        const updatedPropertyType = await prisma.propertyType.update({
            where: { id },
            data: {
                name: normalizedName,
                updatedAt: new Date(),
            },
        });

        return updatedPropertyType;
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new Error('Property type with this name already exists');
        }
        if (error.code === 'P2025') {
            throw new Error('Property type not found');
        }
        throw error;
    }
}

export async function deletePropertyTypeService(id: string) {
    const existingPropertyType = await prisma.propertyType.findFirst({
        where: {
            id,
            deletedAt: null,
        },
    });

    if (!existingPropertyType) {
        throw new Error('Property type not found');
    }

    try {
        const deletedPropertyType = await prisma.propertyType.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });

        return deletedPropertyType;
    } catch (error: any) {
        if (error.code === 'P2025') {
            throw new Error('Property type not found');
        }
        throw error;
    }
}
