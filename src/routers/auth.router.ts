import { Router } from 'express';
import { createAdminProfileController, getUserByIdController, loginController, registerAdminController, registerController, updateUserEmailController, updateUserProfileController, verifyEmailController } from '../controllers/auth.controller';
import { jwtVerify } from '../middlewares/jwt-auth.middleware';
import { JWT_VERIFY_EMAIL } from '../config/main.config';
import { uploaderMulter } from '../utils/multer-uploads';
import { updateUserProfileValidator } from '../validators/update-profile.validator';
import { updateUserEmailValidator } from '../validators/update-email.validator';
import { handleValidationErrors } from '../middlewares/validator-request';

const router = Router();

router.post('/register', registerController);
router.post('/register-admin', registerAdminController);
router.post('/login', loginController);
router.get('/user/:id', getUserByIdController);
router.post('/create-admin-profile', jwtVerify(process.env.JWT_SECRET_KEY!), createAdminProfileController);
router.get('/verify-email', jwtVerify(JWT_VERIFY_EMAIL), verifyEmailController);
router.put(
  '/user/profile', 
  jwtVerify(process.env.JWT_SECRET_KEY!), 
  uploaderMulter(['jpg', 'jpeg', 'png', 'webp']).single('picture'), 
  updateUserProfileValidator,
  handleValidationErrors,
  updateUserProfileController
);
router.put(
  '/user/email', 
  jwtVerify(process.env.JWT_SECRET_KEY!),
  updateUserEmailValidator,
  handleValidationErrors,
  updateUserEmailController
);



export default router;