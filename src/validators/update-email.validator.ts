import { body } from 'express-validator';

export const updateUserEmailValidator = [
    body('email')
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email format')
        .isLength({ max: 120 })
        .withMessage('Email must be at most 120 characters')
        .normalizeEmail()
];
