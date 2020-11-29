import { getBackendSrv } from '@grafana/runtime';

export function refreshToken() {
  getBackendSrv().get(`/api/user/token`);
}
