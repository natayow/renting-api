import { body, ValidationChain } from 'express-validator';
import prisma from '../config/prisma-client';

export const createRoomValidation: ValidationChain[] = [
    body('propertyId')
        .notEmpty()
        .withMessage('Property ID is required')
        .isString()
        .withMessage('Property ID must be a string')
        .custom(async (value) => {
            const property = await prisma.property.findUnique({
                where: { id: value },
            });

            if (!property) {
                throw new Error('Property not found');
            }

            return true;
        }),

    body('name')
        .notEmpty()
        .withMessage('Room name is required')
        .isString()
        .withMessage('Room name must be a string')
        .trim()
        .isLength({ min: 2, max: 120 })
        .withMessage('Room name must be between 2 and 120 characters'),

    body('description')
        .optional()
        .isString()
        .withMessage('Description must be a string')
        .trim(),

    body('maxGuests')
        .notEmpty()
        .withMessage('Maximum guests is required')
        .isInt({ min: 1 })
        .withMessage('Maximum guests must be at least 1')
        .toInt(),

    body('beds')
        .notEmpty()
        .withMessage('Number of beds is required')
        .isInt({ min: 1 })
        .withMessage('Beds must be at least 1')
        .toInt(),

    body('bathrooms')
        .notEmpty()
        .withMessage('Number of bathrooms is required')
        .isInt({ min: 1 })
        .withMessage('Bathrooms must be at least 1')
        .toInt(),

    body('basePricePerNightIdr')
        .notEmpty()
        .withMessage('Base price per night is required')
        .isInt({ min: 0 })
        .withMessage('Base price must be a non-negative integer')
        .toInt(),

    body('facilityIds')
        .optional()
        .custom(async (value) => {
            if (value) {
                let facilityIds: string[] = [];
                
                if (Array.isArray(value)) {
                    facilityIds = value;
                } else if (typeof value === 'string') {
                    try {
                        facilityIds = JSON.parse(value);
                    } catch (e) {
                        facilityIds = [value];
                    }
                }

                if (facilityIds.length > 0) {
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
            }

            return true;
        }),
];

export const updateRoomValidation: ValidationChain[] = [
    body('name')
        .optional()
        .isString()
        .withMessage('Room name must be a string')
        .trim()
        .isLength({ min: 2, max: 120 })
        .withMessage('Room name must be between 2 and 120 characters'),

    body('description')
        .optional()
        .isString()
        .withMessage('Description must be a string')
        .trim(),

    body('maxGuests')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Maximum guests must be at least 1')
        .toInt(),

    body('beds')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Beds must be at least 1')
        .toInt(),

    body('bathrooms')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Bathrooms must be at least 1')
        .toInt(),

    body('basePricePerNightIdr')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Base price must be a non-negative integer')
        .toInt(),

    body('facilityIds')
        .optional()
        .custom(async (value) => {
            if (value !== undefined) {
                let facilityIds: string[] = [];
                
                if (Array.isArray(value)) {
                    facilityIds = value;
                } else if (typeof value === 'string') {
                    try {
                        facilityIds = JSON.parse(value);
                    } catch (e) {
                        facilityIds = [value];
                    }
                }

                if (facilityIds.length > 0) {
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
            }

            return true;
        }),
];
