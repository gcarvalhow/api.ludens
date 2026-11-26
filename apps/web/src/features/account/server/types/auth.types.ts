import { z } from 'zod';

import {
  changePasswordSchema,
  forgotSchema,
  loginSchema,
  registerSchema,
  resetSchema,
  tokenResponseSchema,
  userSchema,
  updateProfileSchema,
  emailChangeSchema,
} from '@account/schemas/auth.schema';

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotSchema>;
export type ResetPasswordRequest = z.infer<typeof resetSchema>;

export type TokenResponse = z.infer<typeof tokenResponseSchema>;
export type User = z.infer<typeof userSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;
export type EmailChangeFormValues = z.infer<typeof emailChangeSchema>;
export type EmailChangeRequest = Pick<EmailChangeFormValues, 'new_email'>;
export type MessageResponse = { message: string };
