import React, { useEffect, useMemo, useState } from 'react';
import { useIdleTimer, workerTimers } from 'react-idle-timer';

import { getBackendSrv } from '@grafana/runtime';
import { ConfirmModal } from '@grafana/ui';
import { contextSrv } from 'app/core/core';

export const IdleTimer = () => {
  // Set timeout values
  const timeout = 1000 * 60 * 5;
  const promptTimeout = 1000 * 30;

  const idleChannel = useMemo(() => new BroadcastChannel('idleUser'), []);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [remaining, setRemaining] = useState<number>(promptTimeout);

  const refresh = () => {
    getBackendSrv().loginPing();
  };

  const onPrompt = () => {
    // Fire a Modal Prompt
    setIsOpen(true);
    setRemaining(promptTimeout);
  };

  const onIdle = () => {
    // Close Modal Prompt
    // Do some idle action like log out your user
    handleLogout();
  };

  const onActive = (event: any) => {
    // Close Modal Prompt
    // Do some active action
    setIsOpen(false);
    setRemaining(0);
    refresh();
  };

  const onAction = (event: any) => {
    // Close Modal Prompt
    // Do some active action

    // Workaround for multi tabs
    idleChannel.postMessage({});
  };

  const { reset, pause, isPrompted, getRemainingTime } = useIdleTimer({
    onPrompt,
    onIdle,
    onActive,
    onAction,
    timeout: timeout,
    promptTimeout: promptTimeout,
    crossTab: false, // Does not work properly, see: https://github.com/SupremeTechnopriest/react-idle-timer/issues/247
    timers: workerTimers,
    name: 'idle-timer',
    syncTimers: 200,
  });

  let modalBody = `You will be logged out automatically in ${remaining}s. You want to stay?`;

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPrompted()) {
        setRemaining(Math.ceil(getRemainingTime() / 1000));
      }
      idleChannel.onmessage = () => reset();
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [getRemainingTime, idleChannel, isPrompted, reset]);

  useEffect(() => {
    if (!contextSrv.isSignedIn) {
      pause();
    } else {
      reset();
    }
  }, [pause, reset]);

  const logout = () => {
    window.location.assign('/logout');
  };

  const handleClose = () => {
    setIsOpen(false);
    reset();
  };

  const handleLogout = () => {
    setRemaining(0);
    setIsOpen(false);
    logout();
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      title="Inactive session"
      body={modalBody}
      confirmText="Logout"
      dismissText="Stay"
      icon="exclamation-triangle"
      onConfirm={handleLogout}
      onDismiss={handleClose}
    />
  );
};
