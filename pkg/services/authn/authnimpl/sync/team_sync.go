package sync

import (
	"context"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/authn"
	"github.com/grafana/grafana/pkg/services/dashboards"
	"github.com/grafana/grafana/pkg/services/team"
	"github.com/grafana/grafana/pkg/services/user"
)

func ProvideTeamSync(userService user.Service, teamService team.Service, accessControl accesscontrol.Service) *TeamSync {
	return &TeamSync{userService, teamService, accessControl, log.New("team.sync")}
}

type TeamSync struct {
	userService   user.Service
	teamService   team.Service
	accessControl accesscontrol.Service

	log log.Logger
}

func (s *TeamSync) SyncTeamRolesHook(ctx context.Context, id *authn.Identity, _ *authn.Request) error {
	ctxLogger := s.log.FromContext(ctx)

	namespace, userID := id.NamespacedID()
	if namespace != authn.NamespaceUser || userID <= 0 {
		ctxLogger.Warn("Failed to sync teams, invalid namespace for identity", "id", id.ID, "namespace", namespace)
		return nil
	}

	ctxLogger.Debug("Syncing teams", "id", id.ID, "teams", id.Groups)

	if len(id.Groups) == 0 {
		ctxLogger.Debug("Not syncing teams since external user doesn't have any", "id", id.ID)
		return nil
	}

	// Create a temporary user with the necessary permissions to read teams.
	tempUser := &user.SignedInUser{
		OrgID: id.OrgID,
		Permissions: map[int64]map[string][]string{
			id.OrgID: {
				accesscontrol.ActionTeamsRead:  {accesscontrol.ScopeTeamsAll},
				accesscontrol.ActionTeamsWrite: {accesscontrol.ScopeTeamsAll},
			},
		},
	}

	// Retrieve the names of all teams in Grafana using tempUser.
	searchResult, err := s.teamService.SearchTeams(ctx, &team.SearchTeamsQuery{OrgID: id.OrgID, Page: 1, Limit: 1000, SignedInUser: tempUser})
	if err != nil {
		ctxLogger.Error("Failed to search for teams", "error", err)
		return err
	}

	teamNameToID := make(map[string]int64)
	for _, t := range searchResult.Teams {
		teamNameToID[t.Name] = t.ID
	}

	// Retrieve current team memberships for the user using tempUser.
	getTeamsByUserQuery := &team.GetTeamsByUserQuery{
		OrgID:        id.OrgID,
		UserID:       userID,
		SignedInUser: tempUser,
	}
	currentTeams, err := s.teamService.GetTeamsByUser(ctx, getTeamsByUserQuery)
	if err != nil {
		ctxLogger.Error("Failed to get user's current teams", "id", id.ID, "error", err)
		return err
	}

	// Construct a mapping of team IDs the user currently belongs to.
	currentTeamIDs := make(map[int64]bool)
	for _, team := range currentTeams {
		currentTeamIDs[team.ID] = true
	}

	// Check which teams the user should be added to or removed from.
	for _, teamName := range id.Groups {
		teamID, exists := teamNameToID[teamName]
		if exists {
			if _, isMember := currentTeamIDs[teamID]; !isMember {
				err := s.teamService.AddTeamMember(userID, id.OrgID, teamID, true, dashboards.PERMISSION_VIEW)
				if err != nil {
					ctxLogger.Error("Failed to add user to team", "id", id.ID, "teamId", teamID, "error", err)
				}
			} else {
				// Mark this team so we don't try to remove the user from it.
				currentTeamIDs[teamID] = false
			}
		}
	}

	// Remove the user from teams they shouldn't be part of.
	for teamID, isMember := range currentTeamIDs {
		if isMember {
			cmd := &team.RemoveTeamMemberCommand{TeamID: teamID, UserID: userID, OrgID: id.OrgID}
			if err := s.teamService.RemoveTeamMember(ctx, cmd); err != nil {
				ctxLogger.Error("Failed to remove user from team", "id", id.ID, "teamId", teamID, "orgId", id.OrgID, "error", err)
			}
		}
	}

	return nil
}
