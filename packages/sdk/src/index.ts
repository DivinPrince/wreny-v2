import { APIClient } from "./core";
import { AgentResource } from "./resources/agent";
import { CoverLettersResource } from "./resources/cover-letters";
import { JobsResource } from "./resources/jobs";
import { ResumesResource } from "./resources/resumes";
import { UploadResource } from "./resources/upload";
import { UsersResource } from "./resources/users";

export * from "./error";
export * from "./types";
export * from "./resources/agent";
export * from "./resources/cover-letters";
export * from "./resources/jobs";
export * from "./resources/resumes";
export * from "./resources/users";
export * from "./resources/upload";

export interface SdkOptions {
  baseURL?: string;
  token?: string;
  credentials?: RequestCredentials;
  timeout?: number;
  maxRetries?: number;
  fetch?: typeof fetch;
  headers?: Record<string, string>;
}

export class Sdk extends APIClient {
  agent: AgentResource;
  coverLetters: CoverLettersResource;
  jobs: JobsResource;
  resumes: ResumesResource;
  users: UsersResource;
  upload: UploadResource;

  constructor(options: SdkOptions = {}) {
    const {
      baseURL = "http://localhost:3000",
      token,
      credentials,
      timeout,
      maxRetries,
      fetch: customFetch,
      headers,
    } = options;

    super({
      baseURL,
      token,
      credentials,
      timeout,
      maxRetries,
      fetch: customFetch,
      headers,
    });

    this.agent = new AgentResource(this);
    this.coverLetters = new CoverLettersResource(this);
    this.jobs = new JobsResource(this);
    this.resumes = new ResumesResource(this);
    this.users = new UsersResource(this);
    this.upload = new UploadResource(this);
  }
}

export default Sdk;
