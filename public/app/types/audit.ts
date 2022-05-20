export interface AuditRecord {
  id: number;
  created_at: string;
  username: string;
  action: string;
  ip_address: string;
}

export interface AuditRecordsState {
  records: AuditRecord[];
  searchQuery: string;
  hasFetched: boolean;
}
