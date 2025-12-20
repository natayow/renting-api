import { body, ValidationChain } from 'express-validator';
import prisma from '../config/prisma-client';
import { PropertyStatus } from '../generated/prisma';

export const createPropertyValidation: ValidationChain[] = [
    body('adminUserId')
        .notEmpty()
        .withMessage('Admin user ID is required')
        .isString()
        .withMessage('Admin user ID must be a string')
        .custom(async (value) => {
            const adminUser = await prisma.user.findUnique({
                where: { id: value },
            });

            if (!adminUser) {
                throw new Error('Admin user not found');
            }

            if (adminUser.role !== 'ADMIN') {
                throw new Error('User must have ADMIN role to create properties');
            }

            return true;
        }),

    body('title')
        .notEmpty()
        .withMessage('Title is required')
        .isString()
        .withMessage('Title must be a string')
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),

    body('description')
        .optional()
        .isString()
        .withMessage('Description must be a string')
        .trim(),

    body('typeId')
        .optional()
        .isString()
        .withMessage('Property type ID must be a string')
        .custom(async (value) => {
            if (value) {
                const propertyType = await prisma.propertyType.findUnique({
                    where: { id: value },
                });

                if (!propertyType) {
                    throw new Error('Property type not found');
                }
            }
            return true;
        }),

    body('city')
        .notEmpty()
        .withMessage('City is required')
        .isString()
        .withMessage('City must be a string')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('City must be between 2 and 100 characters'),

    body('country')
        .notEmpty()
        .withMessage('Country is required')
        .isString()
        .withMessage('Country must be a string')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Country must be between 2 and 100 characters'),

    body('address')
        .notEmpty()
        .withMessage('Address is required')
        .isString()
        .withMessage('Address must be a string')
        .trim()
        .isLength({ min: 5, max: 500 })
        .withMessage('Address must be between 5 and 500 characters'),

    body('minNights')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Minimum nights must be at least 1')
        .toInt(),

    body('maxNights')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Maximum nights must be at least 1')
        .toInt()
        .custom((value, { req }) => {
            const minNights = Number(req.body.minNights);
            const maxNights = Number(value);
            
            if (minNights && maxNights && maxNights < minNights) {
                throw new Error('Maximum nights must be greater than or equal to minimum nights');
            }
            return true;
        }),

    body('rooms')
        .optional()
        .custom((value) => {
            let roomsArray = value;
            if (typeof value === 'string') {
                try {
                    roomsArray = JSON.parse(value);
                } catch (e) {
                    throw new Error('Rooms must be a valid JSON array');
                }
            }

            if (roomsArray) {
                if (!Array.isArray(roomsArray)) {
                    throw new Error('Rooms must be an array');
                }

                if (roomsArray.length === 0) {
                    throw new Error('At least one room is required');
                }

                roomsArray.forEach((room: any, index: number) => {
                    if (!room.name || typeof room.name !== 'string') {
                        throw new Error(`Room ${index + 1}: Name is required and must be a string`);
                    }
                    if (room.name.trim().length < 3 || room.name.trim().length > 120) {
                        throw new Error(`Room ${index + 1}: Name must be between 3 and 120 characters`);
                    }

                    if (room.description !== undefined && room.description !== null && room.description !== '') {
                        if (typeof room.description !== 'string') {
                            throw new Error(`Room ${index + 1}: Description must be a string`);
                        }
                    }

                    if (room.maxGuests === undefined || room.maxGuests === null) {
                        throw new Error(`Room ${index + 1}: Max guests is required`);
                    }
                    const maxGuests = Number(room.maxGuests);
                    if (isNaN(maxGuests) || maxGuests < 1) {
                        throw new Error(`Room ${index + 1}: Max guests must be at least 1`);
                    }

                    if (room.beds === undefined || room.beds === null) {
                        throw new Error(`Room ${index + 1}: Beds is required`);
                    }
                    const beds = Number(room.beds);
                    if (isNaN(beds) || beds < 1) {
                        throw new Error(`Room ${index + 1}: Beds must be at least 1`);
                    }

                    if (room.bathrooms === undefined || room.bathrooms === null) {
                        throw new Error(`Room ${index + 1}: Bathrooms is required`);
                    }
                    const bathrooms = Number(room.bathrooms);
                    if (isNaN(bathrooms) || bathrooms < 1) {
                        throw new Error(`Room ${index + 1}: Bathrooms must be at least 1`);
                    }

                    if (room.basePricePerNightIdr === undefined || room.basePricePerNightIdr === null) {
                        throw new Error(`Room ${index + 1}: Base price is required`);
                    }
                    const price = Number(room.basePricePerNightIdr);
                    if (isNaN(price) || price < 0) {
                        throw new Error(`Room ${index + 1}: Base price must be 0 or greater`);
                    }
                });

                
            }

            return true;
        }),

    body('status')
        .optional()
        .isIn(['DRAFT', 'ACTIVE', 'INACTIVE'])
        .withMessage('Status must be DRAFT, ACTIVE, or INACTIVE'),
];

export const updatePropertyValidation: ValidationChain[] = [
    body('title')
        .optional()
        .isString()
        .withMessage('Title must be a string')
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),

    body('description')
        .optional()
        .isString()
        .withMessage('Description must be a string')
        .trim(),

    body('typeId')
        .optional()
        .custom(async (value) => {
            if (value) {
                const propertyType = await prisma.propertyType.findFirst({
                    where: {
                        id: value,
                        deletedAt: null,
                    },
                });

                if (!propertyType) {
                    throw new Error('Property type not found');
                }
            }
            return true;
        }),

    body('locationId')
        .optional()
        .custom(async (value) => {
            if (value) {
                const location = await prisma.location.findFirst({
                    where: {
                        id: value,
                        deletedAt: null,
                    },
                });

                if (!location) {
                    throw new Error('Location not found');
                }
            }
            return true;
        }),


    body('status')
        .optional()
        .isIn(['DRAFT', 'ACTIVE', 'INACTIVE'])
        .withMessage('Status must be DRAFT, ACTIVE, or INACTIVE'),
];

export const updatePropertyStatusValidation: ValidationChain[] = [
    body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['DRAFT', 'ACTIVE', 'INACTIVE'])
        .withMessage('Status must be DRAFT, ACTIVE, or INACTIVE'),
];