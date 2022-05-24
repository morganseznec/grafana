package api

import (
	"context"
	"net/http"

	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/models"
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/setting"
)

func (hs *HTTPServer) AdminGetSettings(c *models.ReqContext) response.Response {
	settings, err := hs.getAuthorizedSettings(c.Req.Context(), c.SignedInUser, hs.SettingsProvider.Current())
	if err != nil {
		return response.Error(http.StatusForbidden, "Failed to authorize settings", err)
	}
	return response.JSON(http.StatusOK, settings)
}

func (hs *HTTPServer) AdminGetStats(c *models.ReqContext) response.Response {
	statsQuery := models.GetAdminStatsQuery{}

	if err := hs.SQLStore.GetAdminStats(c.Req.Context(), &statsQuery); err != nil {
		return response.Error(500, "Failed to get admin stats from database", err)
	}

	return response.JSON(200, statsQuery.Result)
}

func (hs *HTTPServer) AdminGetAudit(c *models.ReqContext) response.Response {
	perPage := c.QueryInt("perpage")
	if perPage <= 0 {
		perPage = 1000
	}
	page := c.QueryInt("page")
	if page < 1 {
		page = 1
	}

	query := models.SearchAuditRecordsQuery{
		Page:  page,
		Limit: perPage,
	}

	if err := hs.SQLStore.SearchAuditRecords(c.Req.Context(), &query); err != nil {
		return response.Error(500, "Failed to search audit records", err)
	}

	query.Result.Page = page
	query.Result.PerPage = perPage

	return response.JSON(200, query.Result)
}

func (hs *HTTPServer) getAuthorizedSettings(ctx context.Context, user *models.SignedInUser, bag setting.SettingsBag) (setting.SettingsBag, error) {
	if hs.AccessControl.IsDisabled() {
		return bag, nil
	}

	eval := func(scope string) (bool, error) {
		return hs.AccessControl.Evaluate(ctx, user, ac.EvalPermission(ac.ActionSettingsRead, scope))
	}

	ok, err := eval(ac.ScopeSettingsAll)
	if err != nil {
		return nil, err
	}
	if ok {
		return bag, nil
	}

	authorizedBag := make(setting.SettingsBag)

	for section, keys := range bag {
		ok, err := eval(ac.Scope("settings", section, "*"))
		if err != nil {
			return nil, err
		}
		if ok {
			authorizedBag[section] = keys
			continue
		}

		for key := range keys {
			ok, err := eval(ac.Scope("settings", section, key))
			if err != nil {
				return nil, err
			}
			if ok {
				if _, exists := authorizedBag[section]; !exists {
					authorizedBag[section] = make(map[string]string)
				}
				authorizedBag[section][key] = bag[section][key]
			}
		}
	}
	return authorizedBag, nil
}
