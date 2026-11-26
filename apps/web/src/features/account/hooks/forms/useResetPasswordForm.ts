'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  resetSchema,
} from '@account/schemas/auth.schema';

import type {
  ResetPasswordRequest,
} from '@account/server/types/auth.types';

export function useResetPasswordForm() {
  return useForm<ResetPasswordRequest>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      token: '',
      password: '',
    },
  });
}