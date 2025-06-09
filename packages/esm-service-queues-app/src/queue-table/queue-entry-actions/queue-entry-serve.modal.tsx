import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  Button,
  Checkbox,
  ContentSwitcher,
  InlineNotification,
  ModalBody,
  ModalFooter,
  ModalHeader,
  RadioButton,
  RadioButtonGroup,
  Select,
  SelectItem,
  Stack,
  Switch,
  TextArea,
  TimePicker,
  TimePickerSelect,
} from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { OpenmrsDatePicker, showSnackbar, type FetchResponse } from '@openmrs/esm-framework';
import { time12HourFormatRegexPattern } from '../../constants';
import { convertTime12to24, type amPm } from '../../helpers/time-helpers';
import { useMutateQueueEntries } from '../../hooks/useQueueEntries';
import { useQueues } from '../../hooks/useQueues';
import { type QueueEntry } from '../../types';
import styles from './queue-entry-actions.scss';

interface QueueEntryServeModalProps {
  queueEntry: QueueEntry;
  closeModal: () => void;
  modalParams: ModalParams;
}

interface FormState {
  selectedQueue: string;
  selectedPriority: string;
  selectedStatus: string;
  prioritycomment: string;
  modifyDefaultTransitionDateTime: boolean;
  transitionDate: Date;
  transitionTime: string;
  transitionTimeFormat: amPm;
}

interface ModalParams {
  modalTitle: string;
  modalInstruction: string;
  submitButtonText: string;
  submitSuccessTitle: string;
  submitSuccessText: string;
  submitFailureTitle: string;
  submitAction: (queueEntry: QueueEntry, formState: FormState) => Promise<FetchResponse<any>>;
  disableSubmit: (queueEntry, formState) => boolean;
  isTransition: boolean; // is transition or edit?
}

export const QueueEntryServeModal: React.FC<QueueEntryServeModalProps> = ({ queueEntry, closeModal, modalParams }) => {
  const { t } = useTranslation();
  const { mutateQueueEntries } = useMutateQueueEntries();
  const {
    modalTitle,
    modalInstruction,
    submitButtonText,
    submitSuccessTitle,
    submitSuccessText,
    submitFailureTitle,
    submitAction,
    disableSubmit,
    isTransition,
  } = modalParams;

  const initialTransitionDate = isTransition ? new Date() : new Date(queueEntry.startedAt);
  const [formState, setFormState] = useState<FormState>({
    selectedQueue: queueEntry.queue.uuid,
    selectedPriority: queueEntry.priority.uuid,
    selectedStatus: queueEntry.status.uuid,
    prioritycomment: queueEntry.priorityComment ?? '',
    modifyDefaultTransitionDateTime: false,
    transitionDate: initialTransitionDate,
    transitionTime: dayjs(initialTransitionDate).format('hh:mm'),
    transitionTimeFormat: dayjs(initialTransitionDate).hour() < 12 ? 'AM' : 'PM',
  });
  const { queues } = useQueues();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedQueue = queues.find((q) => q.uuid == formState.selectedQueue);

  const statuses = selectedQueue?.allowedStatuses;
  const hasNoStatusesConfigured = selectedQueue && statuses.length == 0;
  const priorities = selectedQueue?.allowedPriorities;
  const hasNoPrioritiesConfigured = selectedQueue && priorities.length == 0;

  const setSelectedStatusUuid = (selectedStatusUuid: string) => {
    setFormState({ ...formState, selectedStatus: selectedStatusUuid });
  };

  const inServiceUuid = statuses?.find((status) => status.display === 'In Service')?.uuid;

  const submitForm = (e, status) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newFormState = {
      ...formState,
      selectedStatus: status,
    };

    submitAction(queueEntry, newFormState)
      .then(({ status }) => {
        if (status === 200) {
          showSnackbar({
            isLowContrast: true,
            title: submitSuccessTitle,
            kind: 'success',
            subtitle: submitSuccessText,
          });
          mutateQueueEntries();
          closeModal();
        } else {
          throw { message: t('unexpectedServerResponse', 'Unexpected Server Response') };
        }
      })
      .catch((error) => {
        showSnackbar({
          title: submitFailureTitle,
          kind: 'error',
          subtitle: error?.message,
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <>
      <ModalHeader closeModal={closeModal} title={modalTitle} />
      <ModalBody>
        <div className={styles.queueEntryActionModalBody}>
          <Stack gap={4}>
            <h5>{modalInstruction}</h5>
            <p>Patient name: {queueEntry.display}</p>
            <p>Visit Info: {queueEntry.visit.display}</p>
          </Stack>
        </div>
        {/* 
        <RadioButtonGroup
          name="status"
          valueSelected={formState.selectedStatus}
          onChange={(uuid) => {
            setSelectedStatusUuid(uuid);
          }}>
          {statuses?.map(({ uuid, display }) => (
            <RadioButton
              key={uuid}
              name={display}
              labelText={
                uuid == queueEntry.status.uuid
                  ? t('currentValueFormatted', '{{value}} (Current)', {
                      value: display,
                      interpolation: { escapeValue: false },
                    })
                  : display
              }
              value={uuid}
            />
          ))}
        </RadioButtonGroup> */}
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={closeModal}>
          {t('cancel', 'Cancel')}
        </Button>
        <Button
          disabled={isSubmitting || formState.selectedStatus === inServiceUuid}
          onClick={(e) => submitForm(e, inServiceUuid)}>
          {submitButtonText}
        </Button>
      </ModalFooter>
    </>
  );
};

export default QueueEntryServeModal;
