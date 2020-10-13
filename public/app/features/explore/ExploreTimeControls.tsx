// Libaries
import React, { Component } from 'react';

// Types
import { ExploreId } from 'app/types';
import { TimeRange, TimeZone, RawTimeRange, dateTimeForTimeZone } from '@grafana/data';

// State

// Components
import { TimeSyncButton } from './TimeSyncButton';
import { TimePickerWithHistory } from 'app/core/components/TimePicker/TimePickerWithHistory';

// Utils & Services
import { getShiftedTimeRange, getZoomedTimeRange } from 'app/core/utils/timePicker';
import { withTranslation, WithTranslation } from 'react-i18next';

export interface Props extends WithTranslation {
  exploreId: ExploreId;
  hideText?: boolean;
  range: TimeRange;
  timeZone: TimeZone;
  splitted: boolean;
  syncedTimes: boolean;
  onChangeTimeSync: () => void;
  onChangeTime: (range: RawTimeRange) => void;
  onChangeTimeZone: (timeZone: TimeZone) => void;
}

class __ExploreTimeControls extends Component<Props> {
  onMoveTimePicker = (direction: number) => {
    const { range, onChangeTime, timeZone } = this.props;
    const { from, to } = getShiftedTimeRange(direction, range);
    const nextTimeRange = {
      from: dateTimeForTimeZone(timeZone, from),
      to: dateTimeForTimeZone(timeZone, to),
    };

    onChangeTime(nextTimeRange);
  };

  onMoveForward = () => this.onMoveTimePicker(1);
  onMoveBack = () => this.onMoveTimePicker(-1);

  onChangeTimePicker = (timeRange: TimeRange) => {
    this.props.onChangeTime(timeRange.raw);
  };

  onZoom = () => {
    const { range, onChangeTime, timeZone } = this.props;
    const { from, to } = getZoomedTimeRange(range, 2);
    const nextTimeRange = {
      from: dateTimeForTimeZone(timeZone, from),
      to: dateTimeForTimeZone(timeZone, to),
    };

    onChangeTime(nextTimeRange);
  };

  render() {
    const {
      range,
      timeZone,
      splitted,
      syncedTimes,
      onChangeTimeSync,
      hideText,
      onChangeTimeZone,
      t,
      i18n,
      tReady,
    } = this.props;
    const timeSyncButton = splitted ? <TimeSyncButton onClick={onChangeTimeSync} isSynced={syncedTimes} /> : undefined;
    const timePickerCommonProps = {
      value: range,
      timeZone,
      onMoveBackward: this.onMoveBack,
      onMoveForward: this.onMoveForward,
      onZoom: this.onZoom,
      hideText,
    };

    return (
      <TimePickerWithHistory
        {...timePickerCommonProps}
        timeSyncButton={timeSyncButton}
        isSynced={syncedTimes}
        onChange={this.onChangeTimePicker}
        onChangeTimeZone={onChangeTimeZone}
        t={t}
        i18n={i18n}
        tReady={tReady}
      />
    );
  }
}

export const ExploreTimeControls = withTranslation()(__ExploreTimeControls);
