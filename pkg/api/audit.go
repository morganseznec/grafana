package api

import (
	"github.com/grafana/grafana/pkg/bus"
	"github.com/grafana/grafana/pkg/models"
)

// GET /api/audit
func SearchAuditRecords(c *models.ReqContext) Response {
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

	if err := bus.Dispatch(&query); err != nil {
		return Error(500, "Failed to search audit records", err)
	}

	query.Result.Page = page
	query.Result.PerPage = perPage

	return JSON(200, query.Result)
}
