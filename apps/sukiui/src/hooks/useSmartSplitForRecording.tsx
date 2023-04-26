import React, { useState, useEffect } from 'react';
import { isRecording } from '../util/recordingStateUtils';
import { isSpeechPaused } from '../util/soundAnalyserUtils';
import { RECORD_MODE } from '../app/app';

const useSmartSplitForRecording = ({
  recordingStatus,
  isCurrentRecordingMarkedForSplit,
  audioDataForAnalyzer,
  splitRecordingForBatchProcess,
  appDebugLogger,
  transcribeMode,
}: any) => {
  const [three2FiveSecondCounter, setThree2FiveSecondCounter] = useState(0);

  useEffect(() => {
    let smartSplitTimerControl: any = false;
    if (three2FiveSecondCounter >= 0) {
      smartSplitTimerControl = setInterval(
        () => setThree2FiveSecondCounter(three2FiveSecondCounter + 1),
        1000
      );
    }
    if (
      (isCurrentRecordingMarkedForSplit === null ||
        isCurrentRecordingMarkedForSplit === false) &&
      isRecording(recordingStatus) &&
      transcribeMode === RECORD_MODE.batch
    ) {
      appDebugLogger.log(
        'Awaiting a recording split:',
        three2FiveSecondCounter
      );
      if (
        (three2FiveSecondCounter >= 3 &&
          three2FiveSecondCounter < 6 &&
          isSpeechPaused(audioDataForAnalyzer?.data)) ||
        three2FiveSecondCounter >= 6
      ) {
        splitRecordingForBatchProcess();
        setThree2FiveSecondCounter(0);
      }
    } else {
      setThree2FiveSecondCounter(0);
    }

    return () => clearInterval(smartSplitTimerControl);
  }, [three2FiveSecondCounter]);

  return [three2FiveSecondCounter, setThree2FiveSecondCounter];
};

export default useSmartSplitForRecording;
