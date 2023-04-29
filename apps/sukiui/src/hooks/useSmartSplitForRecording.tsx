import React, { useState, useEffect, useContext } from 'react';
import { RECORD_MODE, isRecording } from '../util/recordingStateUtils';
import { isSpeechPaused } from '../util/soundAnalyserUtils';
import AppContext from '../context/AppContext';
import { ConsoleLogger } from '../util/loggerUtil';

const useSmartSplitForRecording = ({
  isCurrentlyRecording,
  isCurrentRecordingMarkedForSplit,
  audioAnalyzerData,
  splitRecordingForBatchProcess,
  transcribeMode,
}: any) => {
  const [three2FiveSecondCounter, setThree2FiveSecondCounter] = useState(0);
  const { appDebugLogger } = useContext(AppContext);
  const appDebugReal = appDebugLogger as ConsoleLogger;

  useEffect(() => {
    let smartSplitTimerControl: NodeJS.Timer;
    if (three2FiveSecondCounter >= 0) {
      smartSplitTimerControl = setInterval(
        () => setThree2FiveSecondCounter(three2FiveSecondCounter + 1),
        1000
      );
    }
    if (
      (isCurrentRecordingMarkedForSplit === null ||
        isCurrentRecordingMarkedForSplit === false) &&
      isCurrentlyRecording &&
      transcribeMode === RECORD_MODE.batch
    ) {
      appDebugReal.log('Awaiting a recording split:', three2FiveSecondCounter);
      if (
        (three2FiveSecondCounter >= 3 &&
          three2FiveSecondCounter < 6 &&
          isSpeechPaused(audioAnalyzerData?.data)) ||
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
