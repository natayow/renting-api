import prisma from '../config/prisma-client';
import { Location } from '../generated/prisma';

export async function createLocationService({ 
    country, 
    city, 
    address 
}: Pick<Location, 'country' | 'city' | 'address'>) {
    if (!country || !country.trim()) {
        throw new Error('Country is required');
    }
    
    if (!city || !city.trim()) {
        throw new Error('City is required');
    }

    const normalizedCountry = country.trim();
    const normalizedCity = city.trim();
    const normalizedAddress = address?.trim() || null;

    try {
        const newLocation = await prisma.location.create({
            data: {
                country: normalizedCountry,
                city: normalizedCity,
                address: normalizedAddress,
            },
        });

        return newLocation;
    } catch (error: any) {
        throw error;
    }
}

export async function getAllLocationsService() {
    const locations = await prisma.location.findMany({
        where: {
            deletedAt: null,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return locations;
}

export async function getLocationByIdService(id: string) {
    const location = await prisma.location.findFirst({
        where: {
            id,
            deletedAt: null,
        },
    });

    return location;
}

export async function getLocationsByCountryService(country: string) {
    if (!country || !country.trim()) {
        throw new Error('Country is required');
    }

    const locations = await prisma.location.findMany({
        where: {
            country: {
                contains: country.trim(),
                mode: 'insensitive',
            },
            deletedAt: null,
        },
        orderBy: {
            city: 'asc',
        },
    });

    return locations;
}

export async function getLocationsByCityService(city: string) {
    if (!city || !city.trim()) {
        throw new Error('City is required');
    }

    const locations = await prisma.location.findMany({
        where: {
            city: {
                contains: city.trim(),
                mode: 'insensitive',
            },
            deletedAt: null,
        },
        orderBy: {
            country: 'asc',
        },
    });

    return locations;
}

export async function updateLocationService(
    id: string, 
    { country, city, address }: Pick<Location, 'country' | 'city' | 'address'>
) {
    if (!country || !country.trim()) {
        throw new Error('Country is required');
    }
    
    if (!city || !city.trim()) {
        throw new Error('City is required');
    }

    const normalizedCountry = country.trim();
    const normalizedCity = city.trim();
    const normalizedAddress = address?.trim() || null;

    const existingLocation = await prisma.location.findFirst({
        where: {
            id,
            deletedAt: null,
        },
    });

    if (!existingLocation) {
        throw new Error('Location not found');
    }

    try {
        const updatedLocation = await prisma.location.update({
            where: { id },
            data: {
                country: normalizedCountry,
                city: normalizedCity,
                address: normalizedAddress,
                updatedAt: new Date(),
            },
        });

        return updatedLocation;
    } catch (error: any) {
        if (error.code === 'P2025') {
            throw new Error('Location not found');
        }
        throw error;
    }
}

export async function deleteLocationService(id: string) {
    const existingLocation = await prisma.location.findFirst({
        where: {
            id,
            deletedAt: null,
        },
    });

    if (!existingLocation) {
        throw new Error('Location not found');
    }

    try {
        const deletedLocation = await prisma.location.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });

        return deletedLocation;
    } catch (error: any) {
        if (error.code === 'P2025') {
            throw new Error('Location not found');
        }
        throw error;
    }
}
