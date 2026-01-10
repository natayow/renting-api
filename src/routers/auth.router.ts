import { Router } from 'express';
import { createAdminProfileController, getUserByIdController, loginController, registerAdminController, registerController } from '../controllers/auth.controller';
import { jwtVerify } from '../middlewares/jwt-auth.middleware';

const router = Router();

router.post('/register', registerController);
router.post('/register-admin', registerAdminController);
router.post('/login', loginController);
router.get('/user/:id', getUserByIdController);
router.post('/create-admin-profile', jwtVerify(process.env.JWT_SECRET_KEY!), createAdminProfileController);



export default router;