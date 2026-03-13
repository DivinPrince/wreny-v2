import { APIResource } from "../core";
import type { Response, RequestOptions } from "../types";
import type {
  UserInfo as User,
  UserCreateInput as CreateUserInput,
  UserUpdateInput as UpdateUserInput,
} from "@repo/core/user";
import type {
  AddressInfo as Address,
  AddressCreateInput as CreateAddressInput,
  AddressUpdateInput as UpdateAddressInput,
} from "@repo/core/address";

export type UpdateProfileInput = Omit<UpdateUserInput, "id" | "role">;

// Admin list parameters
export type UserListParams = Partial<{
  search: string;
  role: "admin" | "user";
  limit: string;
  offset: string;
}>;

/**
 * Users API resource
 */
export class UsersResource extends APIResource {
  /**
   * Get the current user's profile.
   *
   * @example
   * ```typescript
   * const user = await client.users.me();
   * console.log(user.data.email);
   * ```
   */
  me(options?: RequestOptions): Promise<Response<User>> {
    return this._client.get("/api/users/me", options);
  }

  /**
   * Update the current user's profile.
   *
   * @param data - Profile updates
   */
  updateProfile(
    data: UpdateProfileInput,
    options?: RequestOptions,
  ): Promise<Response<User>> {
    return this._client.put("/api/users/me", {
      ...options,
      body: data,
    });
  }

  /**
   * List all addresses for the current user.
   */
  listAddresses(options?: RequestOptions): Promise<Response<Address[]>> {
    return this._client.get("/api/users/me/addresses", options);
  }

  /**
   * Get a specific address by ID.
   *
   * @param id - Address ID
   */
  getAddress(id: string, options?: RequestOptions): Promise<Response<Address>> {
    return this._client.get(`/api/users/me/addresses/${id}`, options);
  }

  /**
   * Create a new address for the current user.
   *
   * @param data - Address data
   */
  createAddress(
    data: CreateAddressInput,
    options?: RequestOptions,
  ): Promise<Response<Address>> {
    return this._client.post("/api/users/me/addresses", {
      ...options,
      body: data,
    });
  }

  /**
   * Update an existing address.
   *
   * @param id - Address ID
   * @param data - Updated address data
   */
  updateAddress(
    id: string,
    data: UpdateAddressInput,
    options?: RequestOptions,
  ): Promise<Response<Address>> {
    return this._client.put(`/api/users/me/addresses/${id}`, {
      ...options,
      body: data,
    });
  }

  /**
   * Delete an address.
   *
   * @param id - Address ID
   */
  deleteAddress(
    id: string,
    options?: RequestOptions,
  ): Promise<{ success: boolean }> {
    return this._client.delete(`/api/users/me/addresses/${id}`, options);
  }

  /**
   * Set an address as the default.
   *
   * @param id - Address ID
   */
  setDefaultAddress(
    id: string,
    options?: RequestOptions,
  ): Promise<Response<Address>> {
    return this._client.post(`/api/users/me/addresses/${id}/default`, options);
  }

  /**
   * List all users with optional filters. Requires admin access.
   *
   * @param params - Query parameters for filtering
   * @example
   * ```typescript
   * const users = await client.users.list({
   *   search: 'john',
   *   role: 'user',
   *   limit: '20'
   * });
   * ```
   */
  list(
    params?: UserListParams,
    options?: RequestOptions,
  ): Promise<Response<User[]>> {
    return this._client.get("/api/users", {
      ...options,
      query: params as Record<string, string | undefined>,
    });
  }

  /**
   * Create a user with credential login. Requires admin access.
   *
   * @param data - New user details
   */
  create(
    data: CreateUserInput,
    options?: RequestOptions,
  ): Promise<Response<User>> {
    return this._client.post("/api/users", {
      ...options,
      body: data,
    });
  }

  /**
   * Get a user by ID. Requires admin access.
   *
   * @param id - User ID
   * @example
   * ```typescript
   * const user = await client.users.get('user_123');
   * console.log(user.data.email);
   * ```
   */
  get(id: string, options?: RequestOptions): Promise<Response<User>> {
    return this._client.get(`/api/users/${id}`, options);
  }

  /**
   * Update an existing user. Requires admin access.
   *
   * @param id - User ID
   * @param data - Updated user fields
   */
  update(
    id: string,
    data: Omit<UpdateUserInput, "id">,
    options?: RequestOptions,
  ): Promise<Response<User>> {
    return this._client.put(`/api/users/${id}`, {
      ...options,
      body: data,
    });
  }
}
