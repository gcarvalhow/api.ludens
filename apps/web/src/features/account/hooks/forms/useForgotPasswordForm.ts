'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  forgotSchema,
} from '@account/schemas/auth.schema';

import type {
  ForgotPasswordRequest,
} from '@account/server/types/auth.types';

export function useForgotPasswordForm() {
  return useForm<ForgotPasswordRequest>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: '',
    },
  });
}
