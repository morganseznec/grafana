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

	// Retrieve the names of all teams in Grafana.
	searchResult, err := s.teamService.SearchTeams(ctx, &team.SearchTeamsQuery{OrgID: id.OrgID, Page: 1, Limit: 1000}) // You might want to adjust the pagination
	if err != nil {
		ctxLogger.Error("Failed to search for teams", "error", err)
		return err
	}

	teamNameToID := make(map[string]int64)
	for _, t := range searchResult.Teams {
		teamNameToID[t.Name] = t.ID
	}

	// Retrieve current team memberships for the user.
	memberships, err := s.teamService.GetUserTeamMemberships(ctx, id.OrgID, userID, false)
	if err != nil {
		ctxLogger.Error("Failed to get user's team memberships", "id", id.ID, "error", err)
		return nil
	}

	// Check which teams the user should be added to or removed from.
	shouldBelongTo := make(map[int64]bool)
	for _, teamName := range id.Groups {
		if teamID, ok := teamNameToID[teamName]; ok {
			shouldBelongTo[teamID] = false
		}
	}

	for _, membership := range memberships {
		if _, shouldStay := shouldBelongTo[membership.TeamID]; shouldStay {
			shouldBelongTo[membership.TeamID] = true
		} else {
			cmd := &team.RemoveTeamMemberCommand{TeamID: membership.TeamID, UserID: userID}
			if err := s.teamService.RemoveTeamMember(ctx, cmd); err != nil {
				ctxLogger.Error("Failed to remove user from team", "id", id.ID, "teamId", membership.TeamID, "error", err)
			}
		}
	}

	// Add the user to teams they should be part of.
	for teamID, isMember := range shouldBelongTo {
		if !isMember {
			err := s.teamService.AddTeamMember(userID, id.OrgID, teamID, false, dashboards.PERMISSION_VIEW)
			if err != nil {
				ctxLogger.Error("Failed to add user to team", "id", id.ID, "teamId", teamID, "error", err)
			}
		}
	}

	return nil
}
