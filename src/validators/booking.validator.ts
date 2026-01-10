import { body, query } from 'express-validator';

export const createBookingValidation = [
    body('propertyId')
        .notEmpty()
        .withMessage('Property ID is required')
        .isUUID()
        .withMessage('Property ID must be a valid UUID'),
    body('roomId')
        .notEmpty()
        .withMessage('Room ID is required')
        .isUUID()
        .withMessage('Room ID must be a valid UUID'),
    body('checkInDate')
        .notEmpty()
        .withMessage('Check-in date is required')
        .isISO8601()
        .withMessage('Check-in date must be a valid date'),
    body('checkOutDate')
        .notEmpty()
        .withMessage('Check-out date is required')
        .isISO8601()
        .withMessage('Check-out date must be a valid date'),
    body('nights')
        .notEmpty()
        .withMessage('Number of nights is required')
        .isInt({ min: 1 })
        .withMessage('Nights must be at least 1'),
    body('guestsCount')
        .notEmpty()
        .withMessage('Number of guests is required')
        .isInt({ min: 1 })
        .withMessage('Guests count must be at least 1'),
    body('paymentMethod')
        .notEmpty()
        .withMessage('Payment method is required')
        .isIn(['BANK_TRANSFER', 'PAYMENT_GATEWAY'])
        .withMessage('Payment method must be BANK_TRANSFER or PAYMENT_GATEWAY'),
];

export const calculatePriceValidation = [
    body('roomId')
        .notEmpty()
        .withMessage('Room ID is required')
        .isUUID()
        .withMessage('Room ID must be a valid UUID'),
    body('checkInDate')
        .notEmpty()
        .withMessage('Check-in date is required')
        .isISO8601()
        .withMessage('Check-in date must be a valid date'),
    body('checkOutDate')
        .notEmpty()
        .withMessage('Check-out date is required')
        .isISO8601()
        .withMessage('Check-out date must be a valid date'),
];

export const availableRoomsValidation = [
    query('propertyId')
        .notEmpty()
        .withMessage('Property ID is required')
        .isUUID()
        .withMessage('Property ID must be a valid UUID'),
    query('checkInDate')
        .notEmpty()
        .withMessage('Check-in date is required')
        .isISO8601()
        .withMessage('Check-in date must be a valid date'),
    query('checkOutDate')
        .notEmpty()
        .withMessage('Check-out date is required')
        .isISO8601()
        .withMessage('Check-out date must be a valid date'),
    query('guestsCount')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Guests count must be at least 1'),
];
