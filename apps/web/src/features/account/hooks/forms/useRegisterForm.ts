'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  registerSchema,
} from '@account/schemas/auth.schema';

import type {
  RegisterRequest,
} from '@account/server/types/auth.types';

export function useRegisterForm() {
  return useForm<RegisterRequest>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      cpf: '',
      email: '',
      password: '',
    },
  });
}