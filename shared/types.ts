export type Role = "USER" | "ADMIN";

export type UserContext = { role: Role; id: string; email: string };
