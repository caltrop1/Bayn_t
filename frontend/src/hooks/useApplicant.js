import { useEffect, useState } from 'react';
import ApplicationModel from '../models/ApplicationModel';
import { registrarService } from '../services/applicationService';

export default function useApplicant(id) {
  const [applicant, setApplicant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    ApplicationModel.fetch(id)
      .then((model) => {
        if (active) setApplicant(model);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const transition = async (options) => {
    const updated = options.requestInformation
      ? await registrarService.requestInformation(id, { rejection_reason: options.reason })
      : await registrarService.review(id, {
        status: options.backendStatus,
        rejection_reason: options.reason,
      });
    const refreshed = await ApplicationModel.fetch(updated.id || id);
    setApplicant(refreshed);
    return refreshed;
  };

  return { applicant, loading, transition };
}
