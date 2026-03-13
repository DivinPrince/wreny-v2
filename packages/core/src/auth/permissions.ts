import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  adminAc,
} from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
  resume: ["create", "read", "update", "delete", "list"],
  coverLetter: ["create", "read", "update", "delete", "list"],
  job: ["create", "read", "update", "delete", "list"],
} as const;

export const ac = createAccessControl(statement);

export const adminRole = ac.newRole({
  ...adminAc.statements,
  resume: ["create", "read", "update", "delete", "list"],
  coverLetter: ["create", "read", "update", "delete", "list"],
  job: ["create", "read", "update", "delete", "list"],
});

export const userRole = ac.newRole({
  resume: ["create", "read", "update", "delete", "list"],
  coverLetter: ["create", "read", "update", "delete", "list"],
  job: ["create", "read", "update", "delete", "list"],
});
