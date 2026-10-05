'use client';

import React from 'react';
import { KanbanTaskBoard } from '../common/KanbanTaskBoard';

export function TaskAllocationDesk() {
  return <KanbanTaskBoard mode="manager" />;
}
