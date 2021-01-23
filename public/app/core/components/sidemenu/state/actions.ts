import { getBackendSrv } from '@grafana/runtime';

export function ping() {
  getBackendSrv().loginPing();
}
