'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  loginSchema,
} from '@account/schemas/auth.schema';

import type {
  LoginRequest,
} from '@account/server/types/auth.types';

export function useLoginForm() {
  return useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
}