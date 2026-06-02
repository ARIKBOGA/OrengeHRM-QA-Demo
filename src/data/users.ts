export interface TestUser {
  username: string;
  password: string;
  role:     'Admin' | 'ESS';
}

export const users = {
  admin: {
    username: 'Admin',
    password: 'admin123',
    role:     'Admin',
  },
} satisfies Record<string, TestUser>;
