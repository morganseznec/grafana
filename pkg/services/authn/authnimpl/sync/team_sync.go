package sync

import (
	"context"
	"sort"
	"strconv"

	claims "github.com/grafana/authlib/types"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/infra/tracing"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/authn"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/team"
	"github.com/grafana/grafana/pkg/services/user"
)

// teamSyncSearchPageSize is the page size used when paginating through every
// team in the org to resolve group names to team IDs.
const teamSyncSearchPageSize = 1000

func ProvideTeamSync(teamService team.Service, teamPermissions accesscontrol.TeamPermissionsService, orgService org.Service, tracer tracing.Tracer) *TeamSync {
	return &TeamSync{
		teamService:     teamService,
		teamPermissions: teamPermissions,
		orgService:      orgService,
		log:             log.New("team.sync"),
		tracer:          tracer,
	}
}

type TeamSync struct {
	teamService     team.Service
	teamPermissions accesscontrol.TeamPermissionsService
	orgService      org.Service
	log             log.Logger
	tracer          tracing.Tracer
}

func (s *TeamSync) SyncTeamRolesHook(ctx context.Context, id *authn.Identity, r *authn.Request, err error) {
	if err != nil || id == nil || r == nil || !id.ClientParams.SyncUser {
		return
	}

	ctx, span := s.tracer.Start(ctx, "team.sync.SyncTeamRolesHook")
	defer span.End()

	ctxLogger := s.log.FromContext(ctx).New("id", id.ID, "login", id.Login)

	if !id.ClientParams.SyncTeams {
		return
	}

	if !id.IsIdentityType(claims.TypeUser) {
		ctxLogger.Warn("Failed to sync teams, invalid namespace for identity", "type", id.GetIdentityType())
		return
	}

	userID, err := id.GetInternalID()
	if err != nil {
		ctxLogger.Warn("Failed to sync teams, invalid ID for identity", "type", id.GetIdentityType(), "err", err)
		return
	}

	// Read the IdP-asserted groups from id.ExternalGroups, never id.Groups.
	// Two upstream refactors compose into a footgun here:
	//   - v13.1 moved the IdP claim off id.Groups onto id.ExternalGroups; every
	//     auth client (oauth.go / ldap.go / jwt.go / grafana.go) now populates
	//     ExternalGroups only.
	//   - v13.2 (upstream PR #124406) repurposed id.Groups: FetchSyncedUserHook
	//     (PostAuth priority 100, before us) now overwrites id.Groups with the
	//     user's stored team UIDs to align Identity.GetGroups() with the k8s
	//     user.Info contract.
	// Falling back to id.Groups when ExternalGroups is empty would therefore
	// hand this hook a list of team UIDs, which resolveTeamIDsByName would
	// fail to match against any team NAME, and the merge-style sync below
	// would remove the user from every External=true team. Prefer safe
	// no-op behaviour: if the IdP asserted no groups, skip.
	groups := id.ExternalGroups

	ctxLogger.Debug("Syncing teams", "extTeams", groups)
	if len(groups) == 0 {
		ctxLogger.Debug("Not syncing teams since external user has no groups")
		return
	}

	// Sync in every org the user is actually a member of. id.OrgRoles can't
	// be trusted here: PostAuth's FetchSyncedUserHook (priority 100) rewrites
	// it to a single-entry map for the user's current org, so by the time our
	// PostLogin hook (priority 150) runs only that one org is visible. We
	// reach into the user's DB org list instead, which OrgSync has already
	// reconciled with the IdP mapping before our hook fires.
	orgIDs, err := s.orgIDsForUser(ctx, userID, id.OrgID)
	if err != nil {
		ctxLogger.Error("Failed to fetch user's orgs", "error", err)
		return
	}
	if len(orgIDs) == 0 {
		ctxLogger.Debug("Not syncing teams since user has no org membership")
		return
	}
	ctxLogger.Debug("Team sync orgs", "orgIDs", orgIDs, "orgRolesCount", len(id.OrgRoles), "identityOrgID", id.OrgID)
	for _, orgID := range orgIDs {
		s.syncOrg(ctx, ctxLogger.New("orgId", orgID), orgID, userID, groups)
	}
}

// orgIDsForUser returns the org IDs the team sync should run in. Source of
// truth is the user's actual org memberships in the database, populated by
// OrgSync (PostAuth priority 40) from the IdP mapping. Results are sorted so
// the pass order is deterministic. Falls back to the identity's OrgID if the
// lookup fails to return rows for some reason — better to sync one org than
// none.
func (s *TeamSync) orgIDsForUser(ctx context.Context, userID, fallbackOrgID int64) ([]int64, error) {
	userOrgs, err := s.orgService.GetUserOrgList(ctx, &org.GetUserOrgListQuery{UserID: userID})
	if err != nil {
		return nil, err
	}
	if len(userOrgs) == 0 {
		if fallbackOrgID > 0 {
			return []int64{fallbackOrgID}, nil
		}
		return nil, nil
	}
	orgIDs := make([]int64, 0, len(userOrgs))
	for _, o := range userOrgs {
		orgIDs = append(orgIDs, o.OrgID)
	}
	sort.Slice(orgIDs, func(i, j int) bool { return orgIDs[i] < orgIDs[j] })
	return orgIDs, nil
}

// syncOrg applies the merge-style sync for a single org. Per-org isolation
// comes from the fact that teams live inside an org: a group name with no
// matching team in this org just produces no add, with no cross-talk to
// teams of the same name in other orgs.
func (s *TeamSync) syncOrg(ctx context.Context, ctxLogger log.Logger, orgID, userID int64, groups []string) {
	teamNameToID, err := s.resolveTeamIDsByName(ctx, orgID, groups)
	if err != nil {
		ctxLogger.Error("Failed to resolve teams from groups", "error", err)
		return
	}
	ctxLogger.Debug("Resolved team names", "matched", teamNameToID, "groupCount", len(groups))

	// Fetch every team membership the user has in this org. external=false
	// here means "no filter on the external flag", not "only manual
	// memberships" — we need the full list both to dedup adds and to detect
	// manual memberships that should be promoted.
	memberships, err := s.teamService.GetUserTeamMemberships(ctx, orgID, userID, false, true)
	if err != nil {
		ctxLogger.Error("Failed to get user's team memberships", "error", err)
		return
	}

	desired := make(map[int64]struct{}, len(teamNameToID))
	for _, teamID := range teamNameToID {
		desired[teamID] = struct{}{}
	}

	membershipByTeam := make(map[int64]*team.TeamMemberDTO, len(memberships))
	for _, m := range memberships {
		membershipByTeam[m.TeamID] = m
	}

	// Remove memberships this sync owns (External=true) that no longer match
	// a group. Manual memberships (External=false) without a matching group
	// are left alone so admin-curated teams survive the sync.
	//
	// We go through TeamPermissionsService.SetUserPermission with an empty
	// permission instead of teamService.RemoveTeamMember directly so the
	// matching teams:read RBAC permission scoped on teams:id:X is also
	// cleared. Without that, the resource-permissions table drifts out of
	// sync with team_member.
	for _, m := range memberships {
		if !m.External {
			continue
		}
		if _, keep := desired[m.TeamID]; keep {
			continue
		}
		if _, err := s.teamPermissions.SetUserPermission(ctx, m.OrgID, accesscontrol.User{ID: userID, IsExternal: true}, strconv.FormatInt(m.TeamID, 10), ""); err != nil {
			ctxLogger.Error("Failed to remove user from team", "teamId", m.TeamID, "error", err)
		}
	}

	// For each desired team:
	//   - already a member externally → nothing to do
	//   - already a member but the row is External=false (admin added it
	//     manually, or it was created by an older sync run before we started
	//     flagging) → ensure RBAC permission exists and promote to
	//     External=true so future syncs own the lifecycle of this membership
	//   - not a member yet → add as External=true (which goes through
	//     SetUserPermission, so the teams:read RBAC permission scoped on
	//     teams:id:X is granted at the same time — otherwise the UI's
	//     RBAC-filtered listings hide the membership even though the
	//     team_member row exists)
	for teamName, teamID := range teamNameToID {
		teamIDStr := strconv.FormatInt(teamID, 10)
		existing, alreadyMember := membershipByTeam[teamID]

		// SetUserPermission is always called for every desired team,
		// regardless of External flag, because it is also the only path that
		// grants the teams:read RBAC permission scoped on teams:id:X. Without
		// that permission, the team store's ac.Filter hides the membership
		// from the UI and from /api/user/teams. Calling SetUserPermission
		// for an already-existing row is idempotent — it just refreshes the
		// permission row and updates the team_member.permission column
		// (External flag is preserved).
		if _, err := s.teamPermissions.SetUserPermission(ctx, orgID, accesscontrol.User{ID: userID, IsExternal: true}, teamIDStr, "Member"); err != nil {
			ctxLogger.Error("Failed to set team membership", "team", teamName, "teamId", teamID, "error", err)
			continue
		}

		switch {
		case !alreadyMember:
			ctxLogger.Debug("Added user to team", "team", teamName, "teamId", teamID)
		case !existing.External:
			// Row exists but was added manually (or by an older sync run
			// before we started flagging). Flip External=true so future
			// syncs own its lifecycle.
			if err := s.teamService.SetTeamMemberExternal(ctx, orgID, teamID, userID, true); err != nil {
				ctxLogger.Error("Failed to promote manual membership to external", "team", teamName, "teamId", teamID, "error", err)
				continue
			}
			ctxLogger.Debug("Promoted manual membership to external", "team", teamName, "teamId", teamID)
		default:
			ctxLogger.Debug("Ensured RBAC permission for existing external membership", "team", teamName, "teamId", teamID)
		}
	}
}

// resolveTeamIDsByName paginates through every team in the org and returns the
// IDs of teams whose name matches one of the requested group names. We page
// through the full list (rather than relying on a single Limit=1000 query) so
// orgs with more than 1000 teams don't silently lose memberships, and we stop
// early as soon as every requested name is found.
func (s *TeamSync) resolveTeamIDsByName(ctx context.Context, orgID int64, groupNames []string) (map[string]int64, error) {
	wanted := make(map[string]struct{}, len(groupNames))
	for _, n := range groupNames {
		wanted[n] = struct{}{}
	}

	// The team sync hook runs as a backend system task — there is no real user
	// "requesting" SearchTeams, but the store's accesscontrol.Filter requires a
	// Requester with teams:read on teams:* to return any rows. Supply a synthetic
	// identity scoped to this org with that permission only.
	requester := teamSyncRequester(orgID)

	found := make(map[string]int64, len(groupNames))
	for page := 1; ; page++ {
		result, err := s.teamService.SearchTeams(ctx, &team.SearchTeamsQuery{
			OrgID:        orgID,
			Page:         page,
			Limit:        teamSyncSearchPageSize,
			SignedInUser: requester,
		})
		if err != nil {
			return nil, err
		}

		for _, t := range result.Teams {
			if _, ok := wanted[t.Name]; !ok {
				continue
			}
			found[t.Name] = t.ID
			if len(found) == len(wanted) {
				return found, nil
			}
		}

		if len(result.Teams) < teamSyncSearchPageSize {
			return found, nil
		}
	}
}

func teamSyncRequester(orgID int64) *user.SignedInUser {
	return &user.SignedInUser{
		OrgID: orgID,
		Permissions: map[int64]map[string][]string{
			orgID: {
				accesscontrol.ActionTeamsRead: {accesscontrol.ScopeTeamsAll},
			},
		},
	}
}
