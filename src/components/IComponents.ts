export interface ICountdown {
  countTimeout: number
}

export interface IErrorView {
    errorMsg?: string
}

export interface ILoadingView {
    loader?: string
}

export interface IRecordButton {
  onClick: () => void,
  recMessage?: {
    press: string,
    rec: string,
    when: string,
  }
}

export interface ITimer {
  timeLimit?: number,
}

export interface IUnsupportedView {
  message?: string
}

export interface IActions {
  isVideoInputSupported: boolean,
  isInlineRecordingSupported: boolean,
  thereWasAnError: boolean,
  isRecording: boolean,
  isCameraOn: boolean,
  streamIsReady: boolean,
  isConnecting: boolean,
  isRunningCountdown: boolean,
  isReplayingVideo: boolean,
  countdownTime: number,
  timeLimit: number,
  showReplayControls: boolean,
  replayVideoAutoplayAndLoopOff: boolean,
  useVideoInput: boolean,

  onTurnOnCamera: () => void,
  onTurnOffCamera: () => void,
  onOpenVideoInput: () => void,
  onStartRecording: () => void,
  onStopRecording: () => void,
  onPauseRecording: () => void,
  onResumeRecording: () => void,
  onStopReplaying: () => void,
  onConfirm: () => void
}
