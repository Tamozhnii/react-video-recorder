import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import { IVideoRecorder } from './IVideoRecorder'
import VideoRecorder from './video-recorder'

const props: IVideoRecorder = {
  isOnInitially: false,
  countdownTime: 0,
  timeLimit: 0,
  showReplayControls: true,
  replayVideoAutoplayAndLoopOff: true,
  chunkSize: 250,
  dataAvailableTimeout: 500,
  useVideoInput: false,
  isFlipped: false
}

ReactDOM.render(
  <VideoRecorder {...props} />,
  document.getElementById('root')
)

export { default } from './video-recorder'
