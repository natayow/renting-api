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

    body('maxGuests')
        .notEmpty()
        .withMessage('Maximum guests is required')
        .isInt({ min: 1 })
        .withMessage('Maximum guests must be at least 1')
        .toInt(),

    body('bedrooms')
        .notEmpty()
        .withMessage('Number of bedrooms is required')
        .isInt({ min: 0 })
        .withMessage('Bedrooms must be a non-negative integer')
        .toInt(),

    body('beds')
        .notEmpty()
        .withMessage('Number of beds is required')
        .isInt({ min: 0 })
        .withMessage('Beds must be a non-negative integer')
        .toInt(),

    body('bathrooms')
        .notEmpty()
        .withMessage('Number of bathrooms is required')
        .isInt({ min: 0 })
        .withMessage('Bathrooms must be a non-negative integer')
        .toInt(),

    body('minNights')
        .notEmpty()
        .withMessage('Minimum nights is required')
        .isInt({ min: 1 })
        .withMessage('Minimum nights must be at least 1')
        .toInt()
        .custom((value, { req }) => {
            const maxNights = parseInt(req.body.maxNights);
            if (maxNights && value > maxNights) {
                throw new Error('Minimum nights cannot be greater than maximum nights');
            }
            return true;
        }),

    body('maxNights')
        .notEmpty()
        .withMessage('Maximum nights is required')
        .isInt({ min: 1 })
        .withMessage('Maximum nights must be at least 1')
        .toInt(),

    body('basePricePerNightIdr')
        .notEmpty()
        .withMessage('Base price per night is required')
        .isInt({ min: 0 })
        .withMessage('Base price must be a non-negative integer')
        .toInt(),

    body('status')
        .optional()
        .isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
        .withMessage('Status must be DRAFT, PUBLISHED, or ARCHIVED'),
];

// Validation rules for updating a property
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

    body('maxGuests')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Maximum guests must be at least 1')
        .toInt(),

    body('bedrooms')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Bedrooms must be a non-negative integer')
        .toInt(),

    body('beds')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Beds must be a non-negative integer')
        .toInt(),

    body('bathrooms')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Bathrooms must be a non-negative integer')
        .toInt(),

    body('minNights')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Minimum nights must be at least 1')
        .toInt()
        .custom((value, { req }) => {
            const maxNights = req.body.maxNights;
            if (maxNights && value > parseInt(maxNights)) {
                throw new Error('Minimum nights cannot be greater than maximum nights');
            }
            return true;
        }),

    body('maxNights')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Maximum nights must be at least 1')
        .toInt(),

    body('basePricePerNightIdr')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Base price must be a non-negative integer')
        .toInt(),

    body('status')
        .optional()
        .isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
        .withMessage('Status must be DRAFT, PUBLISHED, or ARCHIVED'),
];

export const updatePropertyStatusValidation: ValidationChain[] = [
    body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
        .withMessage('Status must be DRAFT, PUBLISHED, or ARCHIVED'),
];