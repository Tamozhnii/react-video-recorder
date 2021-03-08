/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React from 'react'
import './components.css'
import {
  ICountdown,
  IErrorView,
  ILoadingView,
  IRecordButton,
  ITimer,
  IUnsupportedView,
  IActions
} from './IComponents'

const Countdown: React.FC<ICountdown> = ({
  countTimeout
}) => {
  const [count, setCount] = React.useState<number>(countTimeout)

  React.useEffect(() => {
    if (count === 0) return
    setTimeout(() => setCount(count - 1), 1000)
  }, [count])

  return <div className='rvr-countdown'>{count !== 0 ? count : null}</div>
}

const DisconnectedView = (): any => (
  <div className='rvr-disconnected-view'>
    <svg width='210px' height='150px' viewBox='0 0 210 150' version='1.1' xmlns='http://www.w3.org/2000/svg'>
      <g stroke='none' fill='none'>
        <g transform='translate(-915.000000, -356.000000)' fill='#4D4D4D'>
          <path d='/M284,419.636364 C1117.31284,417.512192 1119.03367,415.79021 1121.15642,415.79021 C1123.27917,415.79021 1125,417.512192 1125,419.636364 C1125,447.023515 1111.3017,469.453876 1087.80267,485.191015 C1067.98313,498.464025 1042.15567,506 1019.49682,506 C996.229145,506 970.976604,499.222345 951.727522,486.61975 C928.403996,471.349569 915,448.691655 915,419.636364 C915,417.512192 916.720828,415.79021 918.843578,415.79021 C920.966327,415.79021 922.687155,417.512192 922.687155,419.636364 C922.687155,445.976297 934.696662,466.276987 955.936236,480.18278 C973.867198,491.922388 997.657898,498.307692 1019.49682,498.307692 C1040.66212,498.307692 1064.99852,491.20678 1083.52721,478.798245 C1105.01628,464.407157 1117.31284,444.272084 1117.31284,419.636364 Z M1079.57501,381.174825 C1072.62783,381.174825 1066.99602,375.539249 1066.99602,368.587413 C1066.99602,361.635577 1072.62783,356 1079.57501,356 C1086.52218,356 1092.15399,361.635577 1092.15399,368.587413 C1092.15399,375.539249 1086.52218,381.174825 1079.57501,381.174825 Z M962.870012,381.174825 C955.922833,381.174825 950.291031,375.539249 950.291031,368.587413 C950.291031,361.635577 955.922833,356 962.870012,356 C969.817192,356 975.448993,361.635577 975.448993,368.587413 C975.448993,375.539249 969.817192,381.174825 962.870012,381.174825 Z' />
        </g>
      </g>
    </svg>
  </div>
)

const ErrorView: React.FC<IErrorView> = ({
  errorMsg = 'Oh snap! Your browser failed to record your video. Please restart it and try again'
}) => (
  <div>
    {errorMsg}
  </div>
)

const LoadingView: React.FC<ILoadingView> = ({
  loader = 'Loading...'
}) => (
  <div style={{ fontFamily: 'Arial' }}>
    {loader}
  </div>
)

const RecordButton: React.FC<IRecordButton> = ({
  onClick,
  recMessage = {
    press: 'PRESS',
    rec: 'REC',
    when: 'WHEN READY'
  }
}) => (
  <button className='rvr-rec-wrapper' data-qa='start-recording' onClick={onClick}>
    <div className='rvr-instructions'>
      <div>{recMessage.press} </div>
      <div className='rvr-instuctions-highlight'> {recMessage.rec} </div>
      {recMessage.when}
    </div>
    <div className='rvr-button-border'>
      <button className='rvr-button' />
    </div>
  </button>
)

const Timer: React.FC<ITimer> = ({
  timeLimit
}) => {
  const [nextSeconds, setNextSeconds] = React.useState<number>(timeLimit || 0)

  React.useEffect(() => {
    setInterval(() => {
      setNextSeconds(timeLimit ? nextSeconds - 1 : nextSeconds + 1)
    }, 1000)
  }, [nextSeconds])

  return <div className='rvr-text'><div className='rvr-rec-icon' />{nextSeconds}</div>
}

const UnsupportedView: React.FC<IUnsupportedView> = ({
  message = 'This browser is uncapable of recording video'
}) => (
  <div>{message}</div>
)

const RenderActions: React.FC<IActions> = ({
  isVideoInputSupported,
  isInlineRecordingSupported,
  thereWasAnError,
  isRecording,
  isCameraOn,
  streamIsReady,
  isConnecting,
  isRunningCountdown,
  isReplayingVideo,
  countdownTime,
  timeLimit,
  showReplayControls,
  replayVideoAutoplayAndLoopOff,
  useVideoInput,

  onTurnOnCamera,
  onTurnOffCamera,
  onOpenVideoInput,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onStopReplaying,
  onConfirm
}) => {
  const renderContent = () => {
    const shouldUseVideoInput =
      !isInlineRecordingSupported && isVideoInputSupported

    if (
      (!isInlineRecordingSupported && !isVideoInputSupported) ||
      thereWasAnError ||
      isConnecting ||
      isRunningCountdown
    ) {
      return null
    }

    if (isReplayingVideo) {
      return (
        <button
          className='rvr-button'
          type='button'
          onClick={onStopReplaying}
          data-qa='start-replaying'
        >
          Перезаписать
        </button>
      )
    }

    if (isRecording) {
      return (
        <div className='rvr-border' data-qa='stop-recording'>
          <button className='rvr-stop-button' onClick={onStopRecording} />
        </div>
      )
    }

    if (isCameraOn && streamIsReady) {
      return (
        <RecordButton
          onClick={onStartRecording}
        />
      )
    }

    if (useVideoInput) {
      return (
        <button className='rvr-button' type='button' onClick={onOpenVideoInput} data-qa='open-input'>
          Загрузить видео
        </button>
      )
    }

    return shouldUseVideoInput ? (
      <button className='rvr-button' type='button' onClick={onOpenVideoInput} data-qa='open-input'>
        Записать
      </button>
    ) : (
      <button className='rvr-button' type='button' onClick={onTurnOnCamera} data-qa='turn-on-camera'>
        Включить камеру
      </button>
    )
  }

  return (
    <div>
      {isRecording && <Timer timeLimit={timeLimit} />}
      {isRunningCountdown && <Countdown countTimeout={countdownTime} />}
      <div className='rvr-actions-wrapper'>{renderContent()}</div>
    </div>
  )
}

export {
  DisconnectedView,
  ErrorView,
  LoadingView,
  UnsupportedView,
  RenderActions
}
