export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  group_id: string;
}

// Phase 1 は永続化なしのインメモリストア（DBマイグレーションは統合役の仕事・本スライスの範囲外）。
const usersByEmail = new Map<string, User>();
let nextId = 1;

export const authRepository = {
  upsertByEmail(email: string): User {
    let user = usersByEmail.get(email);
    if (!user) {
      user = {
        id: String(nextId++),
        email,
        name: email.split('@')[0],
        role: 'staff',
        group_id: 'default',
      };
      usersByEmail.set(email, user);
    }
    return user;
  },

  findById(id: string): User | undefined {
    for (const user of usersByEmail.values()) {
      if (user.id === id) return user;
    }
    return undefined;
  },
};
