import { removeFalsyAndEmptyKeys } from '@/util';
import { ApiError, emailHelp, openInNewTab, resubmitRemainingOrder, resubmitOrder } from '@/apiServices';
import { getOrderPath } from '@/shared/orderTable/util';

export const reSubmitAction = async ({ row, openNewTabOnSubmit, showAlert, onSuccess }) => {
  try {
    const orderResubmitData = {
      ...removeFalsyAndEmptyKeys(row),
      alpha_tilt: row.alpha_tilt,
      engine_passiveness: row.engine_passiveness,
      schedule_discretion: row.schedule_discretion,
      directional_bias: row.directional_bias,
    };
    const result = await resubmitOrder({ ...orderResubmitData });

    if (openNewTabOnSubmit) {
      openInNewTab(getOrderPath(result.order));
    }

    // Play success sound if callback provided
    if (onSuccess) {
      onSuccess();
    }

    showAlert({
      severity: 'success',
      message: 'Successfully resubmitted the specified order.',
    });
  } catch (e) {
    if (e instanceof ApiError) {
      showAlert({ severity: 'error', message: e.message });
    } else {
      throw e;
    }
  }
};

export const reSubmitRemainingAction = async ({ row, openNewTabOnSubmit, showAlert, onSuccess }) => {
  try {
    const orderResubmitData = {
      ...removeFalsyAndEmptyKeys(row),
      alpha_tilt: row.alpha_tilt,
      engine_passiveness: row.engine_passiveness,
      schedule_discretion: row.schedule_discretion,
      directional_bias: row.directional_bias,
    };
    const result = await resubmitRemainingOrder({ ...orderResubmitData });

    if (openNewTabOnSubmit) {
      openInNewTab(getOrderPath(result.order));
    }

    // Play success sound if callback provided
    if (onSuccess) {
      onSuccess();
    }

    showAlert({
      severity: 'success',
      message: 'Successfully resubmitted the specified order.',
    });
  } catch (e) {
    if (e instanceof ApiError) {
      showAlert({ severity: 'error', message: e.message });
    } else {
      throw e;
    }
  }
};

export const handleHelpClick = async (id, time_start, duration, account_names, status, pct_filled, showAlert) => {
  try {
    const errorsData = await emailHelp(id);
    const startDate = new Date(time_start);
    const timeEnd = new Date(startDate.getTime() + duration * 1000);

    const emailBody = `
      Order ID: ${id}
      Order Errors: ${JSON.stringify(errorsData)}
      Account Names: ${account_names}
      Time Start: ${time_start}
      Time End: ${timeEnd.toISOString()}
      Status: ${status}
      Duration: ${duration}
      Fill Percentage: ${pct_filled}%`.trim();

    const hiddenLink = document.createElement('a');
    hiddenLink.href = `mailto:help@tread.fi?subject=Issue%20with%20order%20${id}&body=${encodeURIComponent(emailBody)}`;
    hiddenLink.style.display = 'none';
    document.body.appendChild(hiddenLink);
    hiddenLink.click();
    document.body.removeChild(hiddenLink);
  } catch (e) {
    if (e instanceof ApiError) {
      showAlert({ severity: 'error', message: e.message });
    } else {
      throw e;
    }
  }
};
