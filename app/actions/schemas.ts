import { z } from 'zod';

export const clockNumberSchema = z.string()
  .regex(/^\d+$/, { message: 'Clock Number must be a positive number string.' })
  .transform(val => parseInt(val, 10));

export const passwordSchema = z.string()
  .min(6, { message: 'Password must be at least 6 characters long.' })
  .regex(/^[a-zA-Z0-9]+$/, { message: 'Password can only contain letters and numbers.' }); 