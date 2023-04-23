const isSpeechPaused = (audioDataForAnalyzer: Array<number>) => {
  const numberOfsilentBars = audioDataForAnalyzer.reduce((acc, cur) => {
    if (cur <= 20) {
      acc++;
    }
    return acc;
  }, 0);
  //console.log('Silent bars: ', numberOfsilentBars);
  return numberOfsilentBars > 100;
};

export { isSpeechPaused };
