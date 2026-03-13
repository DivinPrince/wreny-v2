import { APIResource } from "../core";
import type { Response, RequestOptions } from "../types";
import type {
  UserInfo as User,
  UserCreateInput as CreateUserInput,
  UserUpdateInput as UpdateUserInput,
} from "@repo/core/user";

export type UpdateProfileInput = Omit<UpdateUserInput, "id" | "role">;

export type UserListParams = Partial<{
  search: string;
  role: "admin" | "user";
  limit: string;
  offset: string;
}>;

export class UsersResource extends APIResource {
  me(options?: RequestOptions): Promise<Response<User>> {
    return this._client.get("/api/users/me", options);
  }

  updateProfile(
    data: UpdateProfileInput,
    options?: RequestOptions,
  ): Promise<Response<User>> {
    return this._client.put("/api/users/me", {
      ...options,
      body: data,
    });
  }
  list(
    params?: UserListParams,
    options?: RequestOptions,
  ): Promise<Response<User[]>> {
    return this._client.get("/api/users", {
      ...options,
      query: params as Record<string, string | undefined>,
    });
  }

  create(
    data: CreateUserInput,
    options?: RequestOptions,
  ): Promise<Response<User>> {
    return this._client.post("/api/users", {
      ...options,
      body: data,
    });
  }
  get(id: string, options?: RequestOptions): Promise<Response<User>> {
    return this._client.get(`/api/users/${id}`, options);
  }

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
