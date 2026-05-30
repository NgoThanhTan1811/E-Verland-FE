import { apiRequest } from "./api-client";

export interface MeAccountResponse {
  account: {
    id: string;
    email: string;
    username?: string;
    normalizedUsername?: string;
    normalizedEmail?: string;
    role?: number;
    status?: number;
    createdAt?: string;
    updatedAt?: string | null;
  };
  profile: {
    id: string;
    accountId: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    phoneNumber?: string;
    gender?: number;
    avatarUrl?: string;
    dateOfBirth?: string;
    createdAt?: string;
    updatedAt?: string | null;
  } | null;
  addresses?: unknown[];
  bankAccounts?: unknown[];
}

export const accountService = {
  me: () => apiRequest<MeAccountResponse>("/account/me"),
};
