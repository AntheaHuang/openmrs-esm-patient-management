import React from 'react';
import { useTranslation } from 'react-i18next';
import { type QueueEntry } from '../../types';
import QueueEntryServeModal from './queue-entry-serve.modal';
import { transitionQueueEntry } from './queue-entry-actions.resource';
import { convertTime12to24 } from '../../helpers/time-helpers';

interface TransitionQueueServeModalProps {
  queueEntry: QueueEntry;
  closeModal: () => void;
  modalTitle?: string;
}

const TransitionQueueServeModal: React.FC<TransitionQueueServeModalProps> = ({
  queueEntry,
  closeModal,
  modalTitle,
}) => {
  const { t } = useTranslation();
  return (
    <QueueEntryServeModal
      queueEntry={queueEntry}
      closeModal={closeModal}
      modalParams={{
        modalTitle: modalTitle || t('servePatient', 'Serve patient'),
        modalInstruction: t(
          'transitionPatientStatusToInService',
          'Please double-checked the following information before serving.',
        ),
        submitButtonText: t('servePatient', 'Serve'),
        submitSuccessTitle: t('queueEntryTransitioned', 'Queue entry transitioned'),
        submitSuccessText: t('queueEntryTransitionedSuccessfully', 'Queue entry transitioned successfully'),
        submitFailureTitle: t('queueEntryTransitionFailed', 'Error transitioning queue entry'),
        submitAction: (queueEntry, formState) => {
          const transitionDate = new Date(formState.transitionDate);
          const [hour, minute] = convertTime12to24(formState.transitionTime, formState.transitionTimeFormat);
          transitionDate.setHours(hour, minute, 0, 0);

          return transitionQueueEntry({
            queueEntryToTransition: queueEntry.uuid,
            newQueue: formState.selectedQueue,
            newStatus: formState.selectedStatus,
            newPriority: formState.selectedPriority,
            newPriorityComment: formState.prioritycomment,
            ...(formState.modifyDefaultTransitionDateTime ? { transitionDate: transitionDate.toISOString() } : {}),
          });
        },
        disableSubmit: (queueEntry, formState) =>
          formState.selectedQueue == queueEntry.queue.uuid && formState.selectedStatus == queueEntry.status.uuid,
        isTransition: true,
      }}
    />
  );
};

export default TransitionQueueServeModal;
