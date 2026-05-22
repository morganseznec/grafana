import { type AccessControlAction } from 'app/types/accessControl';

export type ResourcePermission = {
  id: number;
  resourceId?: string;
  isManaged: boolean;
  isInherited: boolean;
  isServiceAccount: boolean;
  userId?: number;
  userUid?: string;
  userLogin?: string;
  userAvatarUrl?: string;
  team?: string;
  teamId?: number;
  teamUid?: string;
  teamAvatarUrl?: string;
  builtInRole?: string;
  actions: AccessControlAction[];
  permission: string;
  roleName?: string;
  warning?: string;
  // UBIQ: populated client-side from /api/teams/:id/members when displaying
  // a team's permissions, so the UI can show a "Generic OAuth"/"LDAP"/...
  // badge next to memberships that came in via the IdP sync.
  authLabels?: string[];
};

export type SetPermission = {
  userUid?: string;
  teamUid?: string;
  builtInRole?: string;
  permission: string;
  target: PermissionTarget;
};

export enum PermissionTarget {
  None = 'None',
  Team = 'Team',
  User = 'User',
  ServiceAccount = 'ServiceAccount',
  BuiltInRole = 'builtInRole',
}
export type Description = {
  assignments: Assignments;
  permissions: string[];
};

export type Assignments = {
  users: boolean;
  serviceAccounts: boolean;
  teams: boolean;
  builtInRoles: boolean;
};
