import { Button } from '@mui/material';
import MicTwoToneIcon from '@mui/icons-material/MicTwoTone';
import { useCallback, useContext, useEffect } from 'react';
import { RECORD_MODE } from '../util/recordingStateUtils';
import { useSelector, useDispatch } from 'react-redux';
import { setRecording } from '../store/microPhoneSlice';
import {
  insertWaveBlob,
  markCurrentRecordingForSplit,
} from '../store/batchRecordingSlice';
import Recorder from '../util/recorderUtils';
import AppContext from '../context/AppContext';
import { ConsoleLogger } from '../util/loggerUtil';
import useSmartSplitForRecording from '../hooks/useSmartSplitForRecording';

export type MicrophoneRecordingStartStopProps = {
  refs: {
    recorderRef: any;
    socketConnectionRef: any;
    streamSocketConnectionRef: any;
    pcmWorkerRef: any;
    socketDataReceivedRef: any;
    streamSocketDataReceivedRef: any;
    socketMessageSendQueue: any;
    socketSendCounter: any;
    socketMessageSendQueueCopy: any;
  };
};

const MicRecordingStartButton = ({
  refs,
}: MicrophoneRecordingStartStopProps) => {
  const {
    recorderRef,
    socketConnectionRef,
    streamSocketConnectionRef,
    pcmWorkerRef,
    socketDataReceivedRef,
    streamSocketDataReceivedRef,
    socketMessageSendQueueCopy,
    socketMessageSendQueue,
    socketSendCounter,
  } = refs;
  const { isCurrentlyRecording } = useSelector(
    (state: any) => state.microPhone
  );
  const { isMicroPhonePermissionGranted, audioAnalyzerData } = useSelector(
    (state: any) => state.microPhone
  );
  const { isCurrentRecordingMarkedForSplit, capturedWaveBlobs } = useSelector(
    (state: any) => state.batchRecording
  );
  const { transcribeMode } = useSelector((state: any) => state.transcribeMode);
  const dispatch = useDispatch();
  const { appDebugLogger } = useContext(AppContext);
  const appDebugReal = appDebugLogger as ConsoleLogger;
  const clearMessages = () => {
    socketDataReceivedRef.current = [];
    streamSocketDataReceivedRef.current = [];
  };
  const splitRecordingForBatchProcess = () => {
    dispatch(markCurrentRecordingForSplit(true));
  };

  const postSplitStartNewRecording = () => {
    dispatch(markCurrentRecordingForSplit(false));
  };

  const batchRecordingStart = useCallback(() => {
    clearMessages();
    dispatch(setRecording(true)); // setRecordingStatus((_currentStatus) => RECORDING_STATUS.recording);
    const recorder = recorderRef.current as Recorder;

    recorder.start().catch((err: any) => {
      appDebugReal.log('Error recording', err);
    });
  }, [dispatch]);

  const onMessageHandler = (evt: any) => {
    const streamSocket = streamSocketConnectionRef.current as WebSocket;
    streamSocket.send(evt.data);
  };

  const streamRecordingStart = useCallback(() => {
    clearMessages();
    dispatch(setRecording(true));
    const streamSocketRef = streamSocketConnectionRef.current as WebSocket;
    streamSocketRef.send(JSON.stringify({ shouldStartRecording: true }));
    const pcmWorker = pcmWorkerRef.current as AudioWorkletNode;
    if (pcmWorker) {
      if (!pcmWorker.port?.onmessage) {
        pcmWorker.port.onmessage = onMessageHandler;
      }
      pcmWorker.port.postMessage(JSON.stringify({ shouldOpenPort: true }));
      pcmWorker.port?.start();
    } else {
      appDebugReal.error('PCM worker is null');
    }
  }, [dispatch]);

  const startRecording = useCallback(() => {
    if (transcribeMode === RECORD_MODE.batch) {
      batchRecordingStart();
    } else if (transcribeMode === RECORD_MODE.stream) {
      streamRecordingStart();
    }
  }, [transcribeMode, batchRecordingStart, streamRecordingStart]);

  useEffect(() => {
    appDebugReal.log(
      `recording status: ${isCurrentlyRecording}, recording batching: ${isCurrentRecordingMarkedForSplit}, Socket Data Received: ${socketDataReceivedRef.current.join(
        ' '
      )}`
    );

    if (isCurrentRecordingMarkedForSplit) {
      appDebugReal.log(
        'stopping recording processess at',
        new Date().getSeconds()
      );
      const recorder = recorderRef.current as Recorder;
      recorder.stop().then(({ blob, buffer }: any) => {
        const socketObj = socketConnectionRef.current as WebSocket;
        const socketSendQueueObj = socketMessageSendQueue.current as Blob[];
        appDebugReal.log('Trying to send message blob: ', blob);
        socketMessageSendQueueCopy.current.push(blob);
        //dispatch(insertWaveBlob(blob));
        socketSendQueueObj.push(blob);
        appDebugReal.log(
          'Message queue length in Ref and State:',
          socketSendQueueObj.length,
          capturedWaveBlobs.length
        );

        if (isCurrentlyRecording) {
          postSplitStartNewRecording();
        }

        if (socketSendQueueObj.length > 0) {
          const nextAvailableBlob = socketSendQueueObj.splice(0, 1);
          socketObj.send(nextAvailableBlob.pop() as Blob);
          socketSendCounter.current++;
        }
      });
    }

    if (isCurrentRecordingMarkedForSplit === false && isCurrentlyRecording) {
      appDebugReal.log(
        'Started another recording process at',
        new Date().getSeconds()
      );
      const recorder = recorderRef.current as Recorder;
      recorder.start().catch((err: any) => {
        appDebugReal.log('Error recording', err);
      });
    }
  }, [
    isCurrentlyRecording,
    isCurrentRecordingMarkedForSplit,
    capturedWaveBlobs,
  ]);

  useSmartSplitForRecording({
    isCurrentlyRecording,
    isCurrentRecordingMarkedForSplit,
    audioAnalyzerData,
    splitRecordingForBatchProcess,
    transcribeMode,
  });

  if (isMicroPhonePermissionGranted) {
    return (
      <Button variant="outlined" onClick={startRecording}>
        <MicTwoToneIcon /> {!isCurrentlyRecording ? 'Speak' : 'Listening...'}
      </Button>
    );
  }
  return <> </>;
};

export default MicRecordingStartButton;
