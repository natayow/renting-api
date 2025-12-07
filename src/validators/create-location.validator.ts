import { body, query, ValidationChain } from 'express-validator';

export const createLocationValidation: ValidationChain[] = [
    body('country')
        .notEmpty()
        .withMessage('Country is required')
        .isString()
        .withMessage('Country must be a string')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Country must be between 2 and 100 characters'),

    body('city')
        .notEmpty()
        .withMessage('City is required')
        .isString()
        .withMessage('City must be a string')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('City must be between 2 and 100 characters'),

    body('address')
        .notEmpty()
        .withMessage('Address is required')
        .isString()
        .withMessage('Address must be a string')
        .trim()
        .isLength({ min: 5, max: 500 })
        .withMessage('Address must be between 5 and 500 characters'),
];

export const updateLocationValidation: ValidationChain[] = [
    body('country')
        .notEmpty()
        .withMessage('Country is required')
        .isString()
        .withMessage('Country must be a string')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Country must be between 2 and 100 characters'),

    body('city')
        .notEmpty()
        .withMessage('City is required')
        .isString()
        .withMessage('City must be a string')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('City must be between 2 and 100 characters'),

    body('address')
        .notEmpty()
        .withMessage('Address is required')
        .isString()
        .withMessage('Address must be a string')
        .trim()
        .isLength({ min: 5, max: 500 })
        .withMessage('Address must be between 5 and 500 characters'),
];


export const searchByCountryValidation: ValidationChain[] = [
    query('country')
        .notEmpty()
        .withMessage('Country query parameter is required')
        .isString()
        .withMessage('Country must be a string')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Country must be between 2 and 100 characters'),
];

export const searchByCityValidation: ValidationChain[] = [
    query('city')
        .notEmpty()
        .withMessage('City query parameter is required')
        .isString()
        .withMessage('City must be a string')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('City must be between 2 and 100 characters'),
];