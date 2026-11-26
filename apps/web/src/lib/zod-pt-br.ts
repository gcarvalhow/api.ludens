import { z } from 'zod';

import type { ZodErrorMap } from 'zod';

// Fallback em português para qualquer schema que não informe uma
// mensagem própria (`.min(1, '...')` etc. continuam vencendo — o
// error map só entra quando não há mensagem customizada).
const ptBrErrorMap: ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined') {
        return { message: 'Este campo é obrigatório.' };
      }
      return {
        message: `Tipo inválido: esperado ${issue.expected}.`,
      };

    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') {
        return issue.minimum === 1
          ? { message: 'Este campo é obrigatório.' }
          : {
              message: `Deve ter pelo menos ${issue.minimum} caracteres.`,
            };
      }
      if (issue.type === 'number') {
        return {
          message: `Deve ser maior ou igual a ${issue.minimum}.`,
        };
      }
      if (issue.type === 'array') {
        return {
          message: `Deve ter pelo menos ${issue.minimum} item(ns).`,
        };
      }
      break;

    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') {
        return {
          message: `Deve ter no máximo ${issue.maximum} caracteres.`,
        };
      }
      if (issue.type === 'number') {
        return {
          message: `Deve ser menor ou igual a ${issue.maximum}.`,
        };
      }
      break;

    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') {
        return { message: 'E-mail inválido.' };
      }
      if (issue.validation === 'uuid') {
        return { message: 'Identificador inválido.' };
      }
      break;

    case z.ZodIssueCode.invalid_enum_value:
      return { message: 'Selecione uma opção válida.' };
  }

  return { message: ctx.defaultError };
};

z.setErrorMap(ptBrErrorMap);
