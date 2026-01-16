import { body, param } from 'express-validator';

export const createPeakSeasonRateValidation = [
    param('roomId')
        .isUUID()
        .withMessage('Invalid room ID format'),
    body('startDate')
        .notEmpty()
        .withMessage('Start date is required')
        .isISO8601()
        .withMessage('Invalid start date format'),
    body('endDate')
        .notEmpty()
        .withMessage('End date is required')
        .isISO8601()
        .withMessage('Invalid end date format')
        .custom((value, { req }) => {
            if (new Date(value) < new Date(req.body.startDate)) {
                throw new Error('End date must be after or equal to start date');
            }
            return true;
        }),
    body('adjustmentType')
        .notEmpty()
        .withMessage('Adjustment type is required')
        .isIn(['FIXED', 'PERCENTAGE'])
        .withMessage('Adjustment type must be either FIXED or PERCENTAGE'),
    body('adjustmentValue')
        .notEmpty()
        .withMessage('Adjustment value is required')
        .isNumeric()
        .withMessage('Adjustment value must be a number')
        .custom((value, { req }) => {
            const numValue = Number(value);
            if (req.body.adjustmentType === 'PERCENTAGE') {
                if (numValue < 0 || numValue > 1000) {
                    throw new Error('Percentage adjustment must be between 0 and 1000');
                }
            } else if (req.body.adjustmentType === 'FIXED') {
                if (numValue < 0) {
                    throw new Error('Fixed adjustment must be a positive value');
                }
            }
            return true;
        }),
    body('note')
        .optional()
        .isString()
        .withMessage('Note must be a string')
        .isLength({ max: 200 })
        .withMessage('Note must not exceed 200 characters'),
];

export const bulkCreatePeakSeasonRatesValidation = [
    param('roomId')
        .isUUID()
        .withMessage('Invalid room ID format'),
    body('rates')
        .isArray({ min: 1 })
        .withMessage('Rates array is required and must contain at least one item'),
    body('rates.*.startDate')
        .notEmpty()
        .withMessage('Start date is required')
        .isISO8601()
        .withMessage('Invalid start date format'),
    body('rates.*.endDate')
        .notEmpty()
        .withMessage('End date is required')
        .isISO8601()
        .withMessage('Invalid end date format'),
    body('rates.*.adjustmentType')
        .notEmpty()
        .withMessage('Adjustment type is required')
        .isIn(['FIXED', 'PERCENTAGE'])
        .withMessage('Adjustment type must be either FIXED or PERCENTAGE'),
    body('rates.*.adjustmentValue')
        .notEmpty()
        .withMessage('Adjustment value is required')
        .isNumeric()
        .withMessage('Adjustment value must be a number'),
    body('rates.*.note')
        .optional()
        .isString()
        .withMessage('Note must be a string')
        .isLength({ max: 200 })
        .withMessage('Note must not exceed 200 characters'),
];

export const updatePeakSeasonRateValidation = [
    param('id')
        .isUUID()
        .withMessage('Invalid peak season rate ID format'),
    body('startDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid start date format'),
    body('endDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid end date format'),
    body('adjustmentType')
        .optional()
        .isIn(['FIXED', 'PERCENTAGE'])
        .withMessage('Adjustment type must be either FIXED or PERCENTAGE'),
    body('adjustmentValue')
        .optional()
        .isNumeric()
        .withMessage('Adjustment value must be a number'),
    body('note')
        .optional()
        .isString()
        .withMessage('Note must be a string')
        .isLength({ max: 200 })
        .withMessage('Note must not exceed 200 characters'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),
];

export const deletePeakSeasonRateValidation = [
    param('id')
        .isUUID()
        .withMessage('Invalid peak season rate ID format'),
];
