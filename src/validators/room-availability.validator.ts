import { body, param } from 'express-validator';

export const updateRoomAvailabilityValidation = [
    param('roomId')
        .isUUID()
        .withMessage('Invalid room ID format'),
    body('date')
        .notEmpty()
        .withMessage('Date is required')
        .isISO8601()
        .withMessage('Invalid date format'),
    body('isAvailable')
        .notEmpty()
        .withMessage('Availability status is required')
        .isBoolean()
        .withMessage('Availability status must be a boolean'),
];

export const bulkUpdateRoomAvailabilityValidation = [
    param('roomId')
        .isUUID()
        .withMessage('Invalid room ID format'),
    body('dates')
        .isArray({ min: 1 })
        .withMessage('Dates array is required and must contain at least one item'),
    body('dates.*.date')
        .notEmpty()
        .withMessage('Date is required')
        .isISO8601()
        .withMessage('Invalid date format'),
    body('dates.*.isAvailable')
        .notEmpty()
        .withMessage('Availability status is required')
        .isBoolean()
        .withMessage('Availability status must be a boolean'),
];
