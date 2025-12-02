import { Request, Response } from 'express';
import {  getUserByIdService, loginUserService, registerAdminService, registerUserService } from '../services/auth.service';

import bcrypt from 'bcrypt';




export async function registerController(req: Request, res: Response) {
    try {
   
        const { fullName, email, password, phoneNumber } = req.body;


        const result = await registerUserService({ fullName, email, password, phoneNumber });


        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: result.id,
                fullName: result.fullName,
                email: result.email,
                phoneNumber: result.phoneNumber,
      
            }
        });
    } catch (error: any) {

        let statusCode = 500;
        if (error.message.includes('already exists')) {
            statusCode = 400;
        }
        
        res.status(statusCode).json({ 
            success: false, 
            message: error?.message || 'Registration failed', 
            data: null 
        });
    }
}

export async function registerAdminController(req: Request, res: Response) {
    try {
        const { fullName, email, password, phoneNumber } = req.body;

        const newUser = await registerAdminService({ fullName, email, password, phoneNumber });
        res.status(201).json({
            success: true,
            message: 'Admin registered successfully',
            data: newUser
        });
    } catch (error: any) {
        let statusCode = 500;
        if (error.message.includes('already exists')) {
            statusCode = 400;
        }
        
        res.status(statusCode).json({ 
            success: false, 
            message: error?.message || 'Admin registration failed', 
            data: null 
        });
    }
}

export async function loginController(req: Request, res: Response) {
  try {

    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
        data: null,
      });
    }

    const safeuser = await loginUserService({ email, password });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: safeuser,
    });
  } catch (err: any) {
    let statusCode = 500;
    if (err.message === 'INVALID_CREDENTIALS') {
        statusCode = 401;
    }
    
    res.status(statusCode).json({ 
        success: false, 
        message: err?.message === 'INVALID_CREDENTIALS' ? 'Invalid email or password' : err?.message, 
        data: null 
    });
  }
}


export async function getUserByIdController(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const user = await getUserByIdService(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                data: null
            });
        }

        res.status(200).json({
            success: true,
            message: 'User retrieved successfully',
            data: user
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error?.message, data: null });
    }
}

