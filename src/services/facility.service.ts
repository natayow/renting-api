import prisma from '../config/prisma-client';
import { Facility } from '../generated/prisma';

export async function createFacilityService({ name, icon }: Pick<Facility, 'name' | 'icon'>) {
    if (!name || !name.trim()) {
        throw new Error('Facility name is required');
    }

    const normalizedName = name.trim();

    const existingFacility = await prisma.facility.findUnique({
        where: { name: normalizedName }
    });

    if (existingFacility) {
        throw new Error('Facility with this name already exists');
    }

    try {
        const newFacility = await prisma.facility.create({
            data: {
                name: normalizedName,
                icon: icon?.trim() || null,
            },
        });

        return newFacility;
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new Error('Facility with this name already exists');
        }
        throw error;
    }
}

export async function getAllFacilitiesService() {
    const facilities = await prisma.facility.findMany({
        where: {
            deletedAt: null, 
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return facilities;
}

export async function getFacilityByIdService(id: string) {
    const facility = await prisma.facility.findFirst({
        where: {
            id,
            deletedAt: null,
        },
    });

    return facility;
}

export async function updateFacilityService(id: string, { name, icon }: Pick<Facility, 'name' | 'icon'>) {
    if (!name || !name.trim()) {
        throw new Error('Facility name is required');
    }

    const normalizedName = name.trim();

    const existingFacility = await prisma.facility.findFirst({
        where: {
            id,
            deletedAt: null,
        },
    });

    if (!existingFacility) {
        throw new Error('Facility not found');
    }

    const duplicateFacility = await prisma.facility.findFirst({
        where: {
            name: normalizedName,
            id: { not: id },
            deletedAt: null,
        },
    });

    if (duplicateFacility) {
        throw new Error('Facility with this name already exists');
    }

    try {
        const updatedFacility = await prisma.facility.update({
            where: { id },
            data: {
                name: normalizedName,
                icon: icon?.trim() || null,
                updatedAt: new Date(),
            },
        });

        return updatedFacility;
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new Error('Facility with this name already exists');
        }
        throw error;
    }
}

export async function deleteFacilityService(id: string) {
    const existingFacility = await prisma.facility.findFirst({
        where: {
            id,
            deletedAt: null,
        },
    });

    if (!existingFacility) {
        throw new Error('Facility not found');
    }

    const deletedFacility = await prisma.facility.update({
        where: { id },
        data: {
            deletedAt: new Date(),
        },
    });

    return deletedFacility;
}
