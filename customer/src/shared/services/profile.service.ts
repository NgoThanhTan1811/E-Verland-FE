import { apiRequest } from "./api-client";

export interface ProfileResponse {
  id: string;
  accountId: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  phoneNumber?: string;
  gender?: number;
  avatarUrl?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  gender?: number;
  bio?: string;
}

export interface AddressResponse {
  id: string;
  profileId: string;
  label: number;
  city?: string;
  province?: string;
  district?: string;
  ward?: string;
  provinceId?: number;
  districtId?: number;
  wardId?: number;
  wardCode?: string;
  street?: string;
  detail?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AddressRequest {
  label?: number;
  provinceId?: number;
  districtId?: number;
  wardId?: number;
  street?: string;
  detail?: string;
  isDefault?: boolean;
}

export interface BankAccountResponse {
  id: string;
  profileId: string;
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountHolder?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BankAccountRequest {
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountHolder?: string;
}

export const profileService = {
  createProfile: (accountId: string) =>
    apiRequest<ProfileResponse>(`/Profile?accountId=${accountId}`, {
      method: "POST",
    }),

  getProfile: () =>
    apiRequest<{ profile: ProfileResponse | null }>("/account/me").then(
      (response) => response.profile || ({} as ProfileResponse),
    ),

  updateProfile: (accountId: string, data: UpdateProfileRequest) =>
    apiRequest<ProfileResponse>(`/profile/${accountId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Address
  getAddresses: (profileId: string) =>
    apiRequest<AddressResponse[]>(`/profile/${profileId}/address`),

  createAddress: (profileId: string, data: AddressRequest) =>
    apiRequest<AddressResponse>(`/profile/${profileId}/address`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAddress: (profileId: string, id: string) =>
    apiRequest<AddressResponse>(`/profile/${profileId}/address/${id}`),

  updateAddress: (profileId: string, id: string, data: AddressRequest) =>
    apiRequest<AddressResponse>(`/profile/${profileId}/address/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteAddress: (profileId: string, id: string) =>
    apiRequest<void>(`/profile/${profileId}/address/${id}`, {
      method: "DELETE",
    }),

  getDefaultAddress: (profileId: string) =>
    apiRequest<AddressResponse>(`/profile/${profileId}/address/default`),

  // Bank Account
  getBankAccounts: (profileId: string) =>
    apiRequest<BankAccountResponse[]>(`/profile/${profileId}/BankAccount`),

  createBankAccount: (profileId: string, data: BankAccountRequest) =>
    apiRequest<BankAccountResponse>(`/profile/${profileId}/BankAccount`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getBankAccount: (profileId: string, id: string) =>
    apiRequest<BankAccountResponse>(`/profile/${profileId}/BankAccount/${id}`),

  updateBankAccount: (
    profileId: string,
    id: string,
    data: BankAccountRequest,
  ) =>
    apiRequest<BankAccountResponse>(`/profile/${profileId}/BankAccount/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteBankAccount: (profileId: string, id: string) =>
    apiRequest<void>(`/profile/${profileId}/BankAccount/${id}`, {
      method: "DELETE",
    }),
};
