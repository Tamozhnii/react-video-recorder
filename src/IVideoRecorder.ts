export interface IVideoRecorder {
  /** Whether or not to start the camera initially */
  isOnInitially: boolean,
  /** Whether or not to display the video flipped (makes sense for user facing camera) */
  isFlipped: boolean,
  /** Pass this if you want to force a specific mime-type for the video */
  mimeType?: string,
  /** How much time to wait until it starts recording (in ms) */
  countdownTime: number,
  /** Use this if you want to set a time limit for the video (in ms) */
  timeLimit: number,
  /** Use this if you want to show play/pause/etc. controls on the replay video */
  showReplayControls: boolean,
  /** Use this to turn off autoplay and looping of the replay video. It is recommended to also showReplayControls in order to play */
  replayVideoAutoplayAndLoopOff: boolean,
  /** Use this if you want to customize the constraints passed to getUserMedia() */
  // eslint-disable-next-line no-undef
  constraints?: MediaStreamConstraints,
  chunkSize: number,
  dataAvailableTimeout: number,
  useVideoInput: boolean,
  renderDisconnectedView?: Function,
  renderLoadingView?: Function,
  renderVideoInputView?: Function,
  renderUnsupportedView?: Function,
  renderErrorView?: Function,
  renderActions?: Function,
  onCameraOn?: Function,
  onTurnOnCamera?: Function,
  onTurnOffCamera?: Function,
  onStartRecording?: Function,
  onStopRecording?: Function,
  onPauseRecording?: Function,
  onResumeRecording?: Function,
  onRecordingComplete?: Function,
  onOpenVideoInput?: Function,
  onStopReplaying?: Function,
  onError?: Function
}

export interface IVideoRecorderState {
  isRecording: boolean,
  isCameraOn: boolean,
  isConnecting: boolean,
  isReplayingVideo: boolean,
  isReplayVideoMuted: boolean,
  thereWasAnError: boolean,
  error?: Error,
  streamIsReady: boolean,
  isInlineRecordingSupported?: boolean,
  isVideoInputSupported?: boolean,
  isRunningCountdown?: boolean,
  stream?: MediaStream,
  videoUrl?: string,
  videoBlob?: Blob,
}

export interface IRenderCameraView {
  isVideoInputSupported?: boolean,
  isReplayingVideo?: boolean,
  isInlineRecordingSupported?: boolean,
  thereWasAnError: boolean,
  error: any,
  isCameraOn: boolean,
  isConnecting: boolean,
  isReplayVideoMuted: boolean
}
