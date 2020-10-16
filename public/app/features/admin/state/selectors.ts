import { AuditRecordsState } from 'app/types';

export const getAuditRecords = (state: AuditRecordsState) => {
  return state.records;
};
