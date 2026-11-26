import {
  changePasswordSchema,
  forgotSchema,
  loginSchema,
  registerSchema,
  resetSchema,
  tokenResponseSchema,
  userSchema,
} from './auth.schema';

describe('registerSchema', () => {
  const valid = {
    name: 'Maria Silva',
    cpf: '12345678901',
    email: 'maria@example.com',
    password: 'senha1234',
  };

  it('aceita um payload válido', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejeita nome vazio', () => {
    const result = registerSchema.safeParse({ ...valid, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejeita CPF com máscara (não apenas 11 dígitos)', () => {
    const result = registerSchema.safeParse({ ...valid, cpf: '123.456.789-01' });
    expect(result.success).toBe(false);
  });

  it('rejeita CPF com menos de 11 dígitos', () => {
    const result = registerSchema.safeParse({ ...valid, cpf: '123' });
    expect(result.success).toBe(false);
  });

  it('rejeita e-mail inválido', () => {
    const result = registerSchema.safeParse({ ...valid, email: 'nao-e-email' });
    expect(result.success).toBe(false);
  });

  it('rejeita senha com menos de 8 caracteres', () => {
    const result = registerSchema.safeParse({ ...valid, password: '1234567' });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('aceita e-mail e senha válidos', () => {
    expect(
      loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success,
    ).toBe(true);
  });

  it('rejeita senha vazia', () => {
    expect(
      loginSchema.safeParse({ email: 'a@b.com', password: '' }).success,
    ).toBe(false);
  });

  it('rejeita e-mail inválido', () => {
    expect(
      loginSchema.safeParse({ email: 'invalido', password: 'x' }).success,
    ).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('limita a senha por bytes UTF-8, inclusive com caracteres acentuados', () => {
    const parse = (password: string) => changePasswordSchema.safeParse({ current_password: 'old-password', new_password: password }).success;
    expect(parse('a'.repeat(72))).toBe(true);
    expect(parse('a'.repeat(73))).toBe(false);
    expect(parse('é'.repeat(36))).toBe(true);
    expect(parse('é'.repeat(37))).toBe(false);
  });
  it('exige snake_case (current_password/new_password)', () => {
    const result = changePasswordSchema.safeParse({
      current_password: 'atual123',
      new_password: 'novaSenha123',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita nova senha curta', () => {
    const result = changePasswordSchema.safeParse({
      current_password: 'atual123',
      new_password: '123',
    });
    expect(result.success).toBe(false);
  });
});

describe('forgotSchema', () => {
  it('aceita e-mail válido', () => {
    expect(forgotSchema.safeParse({ email: 'a@b.com' }).success).toBe(true);
  });

  it('rejeita e-mail inválido', () => {
    expect(forgotSchema.safeParse({ email: 'x' }).success).toBe(false);
  });
});

describe('resetSchema', () => {
  it('exige token e senha com pelo menos 8 caracteres', () => {
    expect(
      resetSchema.safeParse({ token: 'abc', password: 'senha1234' }).success,
    ).toBe(true);
  });

  it('rejeita token vazio', () => {
    expect(
      resetSchema.safeParse({ token: '', password: 'senha1234' }).success,
    ).toBe(false);
  });
});

describe('tokenResponseSchema', () => {
  it('bate com o contrato snake_case do backend (access_token/expires_in)', () => {
    const result = tokenResponseSchema.safeParse({
      access_token: 'jwt.aqui',
      expires_in: 900,
    });
    expect(result.success).toBe(true);
  });

  it('rejeita o shape antigo em camelCase', () => {
    const result = tokenResponseSchema.safeParse({
      accessToken: 'jwt.aqui',
      expiresIn: 900,
    });
    expect(result.success).toBe(false);
  });
});

describe('userSchema', () => {
  it('bate com o contrato real do backend (User/is_admin)', () => {
    const result = userSchema.safeParse({
      id: 'uuid-aqui',
      name: 'Maria Silva',
      email: 'maria@example.com',
      cpf: '12345678901',
      is_admin: false,
    });
    expect(result.success).toBe(true);
  });

  it('rejeita o shape antigo (role em vez de is_admin)', () => {
    const result = userSchema.safeParse({
      id: 'uuid-aqui',
      name: 'Maria Silva',
      email: 'maria@example.com',
      cpf: '12345678901',
      role: 'BUYER',
    });
    expect(result.success).toBe(false);
  });
});
