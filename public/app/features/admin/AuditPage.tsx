import moment from 'moment-timezone';
import React, { PureComponent } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { NavModel } from '@grafana/data';
import Page from 'app/core/components/Page/Page';
import { getNavModel } from 'app/core/selectors/navModel';
import { AuditRecord } from 'app/types/audit';
import { StoreState } from 'app/types/store';

import { loadAuditRecords } from './state/actions';
import { getAuditRecords } from './state/selectors';

interface OwnProps {
  navModel: NavModel;
  records: AuditRecord[];
  hasFetched: boolean;
  searchQuery: string;
}

const mapStateToProps = (state: StoreState) => ({
  navModel: getNavModel(state.navIndex, 'audit-records'),
  records: getAuditRecords(state.records),
  hasFetched: state.records.hasFetched,
});

const mapDispatchToProps = {
  loadAuditRecords,
};

const connector = connect(mapStateToProps, mapDispatchToProps);
type Props = OwnProps & ConnectedProps<typeof connector>;

export class AuditPage extends PureComponent<Props, any> {
  componentDidMount() {
    this.fetchAuditRecords();
  }

  async fetchAuditRecords() {
    await this.props.loadAuditRecords();
  }

  renderAuditRecord(record: AuditRecord) {
    return (
      <tr key={record.id}>
        <td className="width-4">{moment(record.created_at, moment.ISO_8601).format('YYYY-MM-DD HH:mm:ss')}</td>
        <td>{record.username}</td>
        <td>{record.ip_address}</td>
        <td>{record.action}</td>
      </tr>
    );
  }

  renderAuditRecordList() {
    const { records } = this.props;

    return (
      <>
        <div className="admin-list-table">
          <table className="filter-table filter-table--hover form-inline">
            <thead>
              <tr>
                <th>Date</th>
                <th>Username</th>
                <th>IP Address</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>{records.map((record) => this.renderAuditRecord(record))}</tbody>
          </table>
        </div>
      </>
    );
  }

  renderList() {
    const { hasFetched } = this.props;

    if (!hasFetched) {
      return null;
    }

    return this.renderAuditRecordList();
  }

  render() {
    const { hasFetched, navModel } = this.props;

    return (
      <Page navModel={navModel}>
        <Page.Contents isLoading={!hasFetched}>{this.renderList()}</Page.Contents>
      </Page>
    );
  }
}

export default connector(AuditPage);
