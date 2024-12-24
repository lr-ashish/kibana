/*
 * Copyright 2019 LogRhythm, Inc
 * Licensed under the LogRhythm Global End User License Agreement,
 * which can be found through this page: https://logrhythm.com/about/logrhythm-terms-and-conditions/
 */

import React, { useEffect, useRef, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import _ from 'lodash';
import {
  EuiButton,
  EuiCallOut,
  EuiHorizontalRule,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiProgress,
  EuiTextColor,
  EuiOverlayMask,
} from '@elastic/eui';
// @ts-ignore
import { saveAs } from '@elastic/filesaver';
import { FileDownloadStatus, FileType } from '@logrhythm/nm-web-shared/services/session_files';
import { SessionFileDownloader } from '@logrhythm/nm-web-shared/services/session_file_downloader';
import { toastNotifications } from 'ui/notify';
import FileDownloadRow from './file_download_row';

const useStyles = makeStyles({
  modal: {
    minWidth: '600px',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export interface FileDownloadModalProps {
  downloadId: string;
  fileType: FileType;
  onClose: () => void;
}

const FileDownloadModal = (props: FileDownloadModalProps) => {
  const { downloadId, fileType, onClose } = props;

  const classes = useStyles();

  const [downloadStatus, setDownloadStatus] = useState<FileDownloadStatus>({
    overall: 'loading',
    fileStatuses: {},
  });
  const downloader = useRef<SessionFileDownloader | null>(null);

  useEffect(
    () => {
      if (downloader.current && !downloader.current.terminated) {
        downloader.current.abort();
      }

      if (!downloadId) {
        return;
      }

      downloader.current = new SessionFileDownloader(
        downloadId,
        fileType,
        setDownloadStatus,
        fileInfo => {
          saveAs(fileInfo.blob, fileInfo.name);
        },
        toastNotifications.addWarning,
        toastNotifications.addDanger
      );

      downloader.current.start();
    },
    [downloadId]
  );

  const handleClose = () => {
    if (downloader.current && !downloader.current.terminated) {
      toastNotifications.addWarning(
        'The modal cannot be closed until the file download is cancelled or completed.'
      );
      return;
    }

    onClose();
  };

  const fileNames = Object.keys(downloadStatus.fileStatuses);

  if (!downloadId) {
    return null;
  }

  return (
    <EuiOverlayMask>
      <EuiModal className={classes.modal} onClose={handleClose}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            <EuiTextColor
              color={
                downloadStatus.overall === 'error' || downloadStatus.overall === 'partial-success'
                  ? 'danger'
                  : 'default'
              }
            >
              {downloadStatus.overall === 'loading' && 'Downloading Files'}
              {downloadStatus.overall === 'partial-success' && 'Partial Success'}
              {downloadStatus.overall === 'success' && 'Success'}
              {downloadStatus.overall === 'error' && 'Error'}
              {downloadStatus.overall === 'aborted' && 'Cancelled'}
            </EuiTextColor>
          </EuiModalHeaderTitle>
        </EuiModalHeader>
        <EuiModalBody>
          {downloadStatus.overall === 'aborted' && (
            <EuiTextColor color="warning">Lookup was cancelled.</EuiTextColor>
          )}
          {downloadStatus.overall !== 'aborted' && fileNames.length === 0 && (
            <EuiProgress size="xs" color="primary" />
          )}
          {downloadStatus.overall !== 'aborted' && fileNames.length > 0 && (
            <>
              <EuiHorizontalRule />
              {fileNames.sort().map(f => (
                <FileDownloadRow
                  key={`file_${f}`}
                  overallStatus={downloadStatus.overall}
                  fileName={fileType === 'pcap' ? `${f}.pcap` : f}
                  fileStatus={downloadStatus.fileStatuses[f]}
                />
              ))}
            </>
          )}
        </EuiModalBody>
        <EuiModalFooter className={classes.footer}>
          <EuiCallOut
            title="Files may be incomplete, corrupted, or contain malware."
            color="warning"
            size="s"
            iconType="alert"
          />
          {downloadStatus.overall === 'loading' && (
            <EuiButton
              color="warning"
              onClick={() => downloader.current && downloader.current.abort()}
            >
              Cancel Download
            </EuiButton>
          )}
          {downloadStatus.overall !== 'loading' && (
            <EuiButton onClick={handleClose}>Close</EuiButton>
          )}
        </EuiModalFooter>
      </EuiModal>
    </EuiOverlayMask>
  );
};

export default FileDownloadModal; // eslint-disable-line
