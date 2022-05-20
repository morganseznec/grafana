package sqlstore

import (
	"bytes"
	"context"
	"time"

	"github.com/grafana/grafana/pkg/models"
)

func (ss *SQLStore) CreateAuditRecord(ctx context.Context, cmd *models.CreateAuditRecordCommand) error {
	return ss.WithTransactionalDbSession(ctx, func(sess *DBSession) error {
		auditRecord := models.AuditRecord{
			Username:  cmd.Username,
			Action:    cmd.Action,
			IpAddress: cmd.IpAddress,
			CreatedAt: time.Now(),
		}
		_, err := sess.Insert(&auditRecord)
		cmd.Result = auditRecord
		return err
	})
}

func (ss *SQLStore) SearchAuditRecords(ctx context.Context, query *models.SearchAuditRecordsQuery) error {
	return ss.WithTransactionalDbSession(ctx, func(sess *DBSession) error {
		query.Result = models.SearchAuditRecordsQueryResult{
			AuditRecords: make([]*models.AuditRecordDTO, 0),
		}
		var sql bytes.Buffer
		params := make([]interface{}, 0)

		sql.WriteString(`SELECT
		audit_record.id as id,
		audit_record.username as username,
		audit_record.action as action,
		audit_record.created_at as created_at,
		audit_record.ip_address as ip_address
		FROM audit_record as audit_record `)
		sql.WriteString(` ORDER BY audit_record.created_at desc`)

		if query.Limit != 0 {
			offset := query.Limit * (query.Page - 1)
			sql.WriteString(dialect.LimitOffset(int64(query.Limit), int64(offset)))
		}

		if err := x.SQL(sql.String(), params...).Find(&query.Result.AuditRecords); err != nil {
			return err
		}

		auditRecord := models.AuditRecord{}
		countSess := x.Table("audit_record")
		count, err := countSess.Count(&auditRecord)
		query.Result.TotalCount = count

		return err
	})
}
