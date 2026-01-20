import prisma from '../config/prisma-client';
import { User } from '../generated/prisma';
import bcrypt from 'bcrypt';
import { jwtSign } from '../utils/jwt-sign';
import { emailTransporter } from '../utils/nodemailer-transporter';
import { sendMailService } from './mail.service';
import { JWT_VERIFY_EMAIL, LINK_VERIFICATION } from '../config/main.config';


export async function registerAdminService({ fullName, email, password, phoneNumber }: Pick<User, 'fullName' | 'email' | 'password' | 'phoneNumber' >) {

    if (!fullName || !email || !password) {
        throw new Error('Full name, email, and password are required');
    }


    const normalizedEmail = email.toLowerCase().trim();

   
    const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail }
    });
    
    if (existingUser) {
        throw new Error('User with this email already exists');
    }


    const hashedPassword = await bcrypt.hash(password, 10);
   
        const newUser = await prisma.user.create({
            data: {
                fullName: fullName.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                phoneNumber: phoneNumber?.trim() || null,
                role: 'ADMIN',
               
            },
        });

        return {
            id: newUser.id,
            fullName: newUser.fullName,
            email: newUser.email,
            phoneNumber: newUser.phoneNumber,
          
            role: newUser.role,
        };

}



export async function registerUserService({ fullName, email, password, phoneNumber }: Pick<User, 'fullName' | 'email' | 'password' | 'phoneNumber'>) {
    return await prisma.$transaction(async (tx) => {

        if (!fullName || !email || !password) {
            throw new Error('Full name, email, and password are required');
        }


        const normalizedEmail = email.toLowerCase().trim();


        const existingUser = await tx.user.findUnique({
            where: { email: normalizedEmail }
        });
        
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
    
        const hashedPassword = await bcrypt.hash(password, 10);
       
            const newUser = await tx.user.create({
                data: {
                    fullName: fullName.trim(),
                    email: normalizedEmail,
                    password: hashedPassword,
                    phoneNumber: phoneNumber?.trim() || null,
                 
                  
                },
            });

            const token = jwtSign({ userId: newUser?.id }, JWT_VERIFY_EMAIL!, {
                expiresIn: '1d',
            });

            const verificationLink = `${LINK_VERIFICATION}/${token}`;
            

            await sendMailService({
                to: normalizedEmail,
                subject: 'Email Verification',
                templateName: 'email-verification',
                replaceable: {
                    emailUser: normalizedEmail,
                    linkVerification: verificationLink,
                },
            });

            return {
                id: newUser.id,
                fullName: newUser.fullName,
                email: newUser.email,
                phoneNumber: newUser.phoneNumber,
                
            };

    });

}

export async function loginUserService({ email, password }: Pick<User, 'email' | 'password'>) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!user) throw new Error("INVALID_CREDENTIALS");

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new Error("INVALID_CREDENTIALS");

  
  const { password: _pw, ...safeUser } = user;

  const token = jwtSign({ userId: user?.id, role: user?.role }, process.env.JWT_SECRET_KEY!, { expiresIn: '1d' });

  return {
    safeUser,
    token,
  };
}


export async function getUserByIdService(id: string) {
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            pictureUrl: true,
            role: true,
            isVerified: true,
            adminProfile: {
                select: {
                    id: true,
                    displayName: true,
                    description: true,
                    bankName: true,
                    bankAccountNo: true,
                    bankAccountName: true,
                    createdAt: true,
                }
            },
            createdAt: true,
            updatedAt: true,
        },
    });

    return user;
}

export async function createAdminProfileService(userId: string, data: {
    displayName: string;
    description?: string;
    bankName?: string;
    bankAccountNo?: string;
    bankAccountName?: string;
}) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { adminProfile: true }
    });

    if (!user) {
        throw new Error('User not found');
    }

    if (user.adminProfile) {
        throw new Error('Admin profile already exists for this user');
    }

    const result = await prisma.$transaction(async (tx) => {
        const adminProfile = await tx.adminProfile.create({
            data: {
                userId,
                displayName: data.displayName.trim(),
                description: data.description?.trim() || null,
                bankName: data.bankName?.trim() || null,
                bankAccountNo: data.bankAccountNo?.trim() || null,
                bankAccountName: data.bankAccountName?.trim() || null,
            }
        });

        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: { role: 'ADMIN' },
            select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                role: true,
                adminProfile: {
                    select: {
                        id: true,
                        displayName: true,
                        description: true,
                        bankName: true,
                        bankAccountNo: true,
                        bankAccountName: true,
                    }
                }
            }
        });

        return updatedUser;
    });

    return result;
}



export async function verifyEmailService({id}: Pick<User, 'id'>) {
    
    
    const user = await prisma.user.findUnique({
        where: { id }
    });

    if (!user) {
        throw new Error('User not found');
    }

    if (user.isVerified) {
        console.log('User already verified');
        return user;
    }

    const updatedUser = await prisma.user.update({
        where: { id },
        data: { isVerified: true },
    });

    console.log('User verified successfully:', updatedUser.email);
    return updatedUser;
}

export async function updateUserProfileService(userId: string, data: {
    fullName?: string;
    phoneNumber?: string;
    pictureUrl?: string;
}) {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        throw new Error('User not found');
    }

    const updateData: any = {};
    
    if (data.fullName !== undefined) {
        updateData.fullName = data.fullName.trim();
    }
    if (data.phoneNumber !== undefined) {
        updateData.phoneNumber = data.phoneNumber ? data.phoneNumber.trim() : null;
    }
    if (data.pictureUrl !== undefined) {
        updateData.pictureUrl = data.pictureUrl;
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            pictureUrl: true,
            role: true,
            isVerified: true,
            adminProfile: {
                select: {
                    id: true,
                    displayName: true,
                    description: true,
                    bankName: true,
                    bankAccountNo: true,
                    bankAccountName: true,
                }
            }
        }
    });

    return updatedUser;
}