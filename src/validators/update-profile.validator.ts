import { body } from 'express-validator';

export const updateUserProfileValidator = [
  body('fullName')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Full name cannot be empty')
    .isLength({ max: 80 })
    .withMessage('Full name must be at most 80 characters'),
  
  body('phoneNumber')
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number must be at most 20 characters'),
];
