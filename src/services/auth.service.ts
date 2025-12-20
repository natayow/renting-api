import prisma from '../config/prisma-client';
import { User } from '../generated/prisma';
import bcrypt from 'bcrypt';
import { jwtSign } from '../utils/jwt-sign';


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

   

    try {
   
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
    } catch (error: any) {
        if (error.code === 'P2002') {
            
            if (error.meta?.target?.includes('email')) {
                throw new Error('User with this email already exists');
            } 
        }
        throw error;
    }
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

       
       

        try {
       
            const newUser = await tx.user.create({
                data: {
                    fullName: fullName.trim(),
                    email: normalizedEmail,
                    password: hashedPassword,
                    phoneNumber: phoneNumber?.trim() || null,
                 
                  
                },
            });

            

            return {
                id: newUser.id,
                fullName: newUser.fullName,
                email: newUser.email,
                phoneNumber: newUser.phoneNumber,
                
            };
        } catch (error: any) {
            if (error.code === 'P2002') {
     
                if (error.meta?.target?.includes('email')) {
                    throw new Error('User with this email already exists');
                }
            }
            throw error;
        }
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
            role: true,
            
            createdAt: true,
            updatedAt: true,
        },
    });

    return user;
}


