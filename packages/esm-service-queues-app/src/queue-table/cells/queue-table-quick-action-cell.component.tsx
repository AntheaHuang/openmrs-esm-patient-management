import React from 'react';
import { Button, OverflowMenu, OverflowMenuItem } from '@carbon/react';
import { isDesktop, showModal, useLayoutType } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { type QueueTableColumnFunction, type QueueTableCellComponentProps } from '../../types';

export function QueueTableQuickActionCell({ queueEntry }: QueueTableCellComponentProps) {
  const { t } = useTranslation();
  const layout = useLayoutType();

  return (
    <div>
      <Button
        kind="ghost"
        aria-label={t('serve', 'Serve')}
        onClick={() => {
          const dispose = showModal('transition-queue-serve-modal', {
            closeModal: () => dispose(),
            queueEntry,
          });
        }}
        size={isDesktop(layout) ? 'sm' : 'lg'}>
        {t('serve', 'Serve')}
      </Button>
    </div>
  );
}

export const queueTableQuickActionColumn: QueueTableColumnFunction = (key, header) => ({
  key,
  header,
  CellComponent: QueueTableQuickActionCell,
  getFilterableValue: null,
});
