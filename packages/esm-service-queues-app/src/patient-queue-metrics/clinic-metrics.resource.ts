import { useSession, type Visit, openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import useSWR from 'swr';
import { type WaitTime } from '../types';

dayjs.extend(isToday);

export function useActiveVisits() {
  const currentUserSession = useSession();
  const startDate = dayjs().format('YYYY-MM-DD');
  const sessionLocation = currentUserSession?.sessionLocation?.uuid;

  const customRepresentation =
    'custom:(uuid,patient:(uuid,identifiers:(identifier,uuid),person:(age,display,gender,uuid)),' +
    'visitType:(uuid,name,display),location:(uuid,name,display),startDatetime,' +
    'stopDatetime)&fromStartDate=' +
    startDate +
    '&location=' +
    sessionLocation;
  const url = `${restBaseUrl}/visit?includeInactive=false&v=${customRepresentation}`;
  const { data, error, isLoading, isValidating } = useSWR<{ data: { results: Array<Visit> } }, Error>(
    sessionLocation ? url : null,
    openmrsFetch,
  );

  // Create a Set to store unique patient UUIDs
  const uniquePatientUUIDs = new Set();

  data?.data?.results.forEach((visit) => {
    const patientUUID = visit.patient?.uuid;
    const isToday = dayjs(visit.startDatetime).isToday();
    if (patientUUID && isToday) {
      uniquePatientUUIDs.add(patientUUID);
    }
  });

  return {
    activeVisitsCount: uniquePatientUUIDs.size,
    isLoading,
    error,
    isValidating,
  };
}

export function useAverageWaitTime(serviceUuid: string, statusUuid: string) {
  const apiUrl = `${restBaseUrl}/queue-metrics?queue=${serviceUuid}&status=${statusUuid}`;

  const { data, error, isLoading, isValidating, mutate } = useSWR<{ data: WaitTime }, Error>(
    serviceUuid && statusUuid ? apiUrl : null,
    openmrsFetch,
  );

  return {
    waitTime: data ? data?.data : null,
    isLoading,
    error,
    isValidating,
    mutate,
  };
}
