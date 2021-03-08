import React, { InputHTMLAttributes } from 'react'
import { Decoder, tools, Reader } from 'ts-ebml'
import { RenderActions, DisconnectedView, ErrorView, LoadingView, UnsupportedView } from './components/components'
import getVideoInfo, { captureThumb } from './get-video-info'
import {
  ReactVideoRecorderDataIssueError,
  ReactVideoRecorderRecordedBlobsUnavailableError,
  ReactVideoRecorderDataAvailableTimeoutError,
  ReactVideoRecorderMediaRecorderUnavailableError
} from './custom-errors'
import './video-recorder.css'
import { IVideoRecorder, IVideoRecorderState, IRenderCameraView } from './IVideoRecorder'
declare var MediaRecorder: any;

const MIME_TYPES = [
  'video/webm;codecs="vp8,opus"',
  'video/webm;codecs=h264',
  'video/webm;codecs=vp9',
  'video/webm'
]

const CONSTRAINTS = {
  audio: true,
  video: true
}

const VideoRecorder: React.FC<IVideoRecorder> = ({
  isOnInitially,
  mimeType,
  countdownTime = 3000,
  timeLimit,
  showReplayControls,
  replayVideoAutoplayAndLoopOff,
  constraints = CONSTRAINTS,
  chunkSize = 250,
  dataAvailableTimeout = 500,
  useVideoInput,
  renderDisconnectedView = () => <DisconnectedView />,
  renderLoadingView = () => <LoadingView />,
  renderVideoInputView = ({ videoInput }: any) => <>{videoInput}</>,
  renderUnsupportedView = () => <UnsupportedView />,
  renderErrorView = () => <ErrorView />,
  renderActions = RenderActions,
  onCameraOn,
  onTurnOnCamera,
  onTurnOffCamera,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onRecordingComplete,
  onOpenVideoInput,
  onStopReplaying,
  onError,
}) => {
  const [state, setState] = React.useState<IVideoRecorderState>({
    isRecording: false,
    isCameraOn: false,
    isConnecting: false,
    isReplayingVideo: false,
    isReplayVideoMuted: true,
    thereWasAnError: false,
    error: undefined,
    streamIsReady: false,
    isInlineRecordingSupported: undefined,
    isVideoInputSupported: undefined,
    stream: undefined
  })
  const [videoInput, setVideoInput] = React.useState<HTMLInputElement | null>()
  const [cameraVideo, setCameraVideo] = React.useState<HTMLVideoElement | null>()
  const [replayVideo, setReplayVideo] = React.useState<HTMLVideoElement | null>()
  let mediaRecorder = new MediaRecorder(new MediaStream())
  const recordedBlobs: BlobPart[] = []
  const inputMedia: HTMLInputElement = document.createElement('input')
  let thumbnail: any
  let startedAt: number
  

  React.useEffect(() => {
    let mediaSource: MediaSource
    const isInlineRecordingSupported = !!window.MediaSource && !!MediaRecorder && !!navigator.mediaDevices

    if (isInlineRecordingSupported)
      mediaSource = new window.MediaSource()
    const isVideoInputSupported = inputMedia !== undefined
    
    setState({
      ...state,
      isVideoInputSupported,
      isInlineRecordingSupported,
    })

    if (useVideoInput && isOnInitially) {
        handleOpenVideoInput()
      } else if (
        state.isInlineRecordingSupported &&
        isOnInitially
      ) {
        turnOnCamera()
      } else if (
        state.isVideoInputSupported &&
        isOnInitially
      ) {
        handleOpenVideoInput()
      }
  }, [])

  React.useEffect(() => {
    if (
      state.isReplayingVideo
    ) {
      tryToUnmuteReplayVideo()
    }
  }, [])

  // componentWillUnmount () {
  //   turnOffCamera()
  // }

  const turnOnCamera = () => {
    if (onTurnOnCamera) {
      onTurnOnCamera()
    }

    setState({
      ...state,
      isConnecting: true,
      isReplayingVideo: false,
      thereWasAnError: false,
      error: undefined
    })

    const fallbackContraints = {
      audio: true,
      video: true
    }

    navigator.mediaDevices
      .getUserMedia(constraints)
      .catch((err) => {
        // there's a bug in chrome in some windows computers where using `ideal` in the constraints throws a NotReadableError
        if (
          err.name === 'NotReadableError' ||
          err.name === 'OverconstrainedError'
        ) {
          console.warn(
            `Got ${err.name}, trying getUserMedia again with fallback constraints`
          )
          return navigator.mediaDevices.getUserMedia(fallbackContraints)
        }
        throw err
      })
      .then(handleSuccess)
      .catch(handleError)
  }

  const turnOffCamera = () => {
    if (onTurnOffCamera) {
      onTurnOffCamera()
    }

    state.stream && state.stream.getTracks().forEach((stream) => stream.stop())
    setState({
      ...state,
      isCameraOn: false
    })
    clearInterval()
  }

  const handleSuccess = (stream: MediaStream) => {
    stream = stream
    setState({
      ...state,
      isCameraOn: true,
      stream: stream
    })
    if (onCameraOn) {
      onCameraOn()
    }

    if(cameraVideo)
      if (window.URL) {
        cameraVideo.srcObject = stream
      } else {
        cameraVideo.src = stream.id
      }

    // there is probably a better way
    // but this makes sure the start recording button
    // gives the stream a couple miliseconds to be ready
    setTimeout(() => {
      setState({
        ...state,
        isConnecting: false,
        streamIsReady: true
      })
    }, 200)
  }

  const handleError = (err: Error) => {
    console.error('Captured error', err)

    clearTimeout()

    if (onError) {
      onError(err)
    }

    setState({
      ...state,
      isConnecting: state.isConnecting && false,
      isRecording: false,
      thereWasAnError: true,
      error: err
    })

    if (state.isCameraOn) {
      turnOffCamera()
    }
  }

  const handleDataIssue = (event: any) => {
    const error = new ReactVideoRecorderDataIssueError(event)
    console.error(error.message, event)
    handleError(error)
    return false
  }

  const getMimeType = () => {
    if (mimeType) {
      return mimeType
    }

    const mime = window.MediaSource.isTypeSupported
      ? MIME_TYPES.find(window.MediaSource.isTypeSupported)
      : 'video/webm'

    return mimeType || ''
  }

  const isDataHealthOK = (event: any) => {
    if (!event.data) return handleDataIssue(event)

    const dataCheckInterval = 2000 / chunkSize

    // in some browsers (FF/S), data only shows up
    // after a certain amount of time ~everyt 2 seconds
    const blobCount = event.data.length
    if (blobCount > dataCheckInterval && blobCount % dataCheckInterval === 0) {
      const blob = new window.Blob(event.data, {
        type: getMimeType()
      })
      if (blob.size <= 0) return handleDataIssue(event)
    }

    return true
  }

  const tryToUnmuteReplayVideo = () => {
  if(replayVideo)
    {const video = replayVideo
    video.muted = false

    const playPromise = video.play()
    if (!playPromise) {
      video.muted = true
      return
    }

    playPromise
      .then(() => {
        setState({ ...state, isReplayVideoMuted: false })
        // fixes bug where seeking control during autoplay is not available until the video is almost completely played through
        if (replayVideoAutoplayAndLoopOff) {
          video.pause()
          video.loop = false
        }
      })
      .catch((err) => {
        console.warn('Could not autoplay replay video', err)
        video.muted = true
        return video.play()
      })
      .catch((err) => {
        console.warn('Could play muted replay video after failed autoplay', err)
      })}
  }

  const handleDataAvailable = (event: any) => {
    if (isDataHealthOK(event)) {
      recordedBlobs.push(event.data)
    }
  }

  const handleStopRecording = () => {
    if (onStopRecording) {
      onStopRecording()
    }

    if (!mediaRecorder) {
      handleError(new ReactVideoRecorderMediaRecorderUnavailableError())
      return
    }

    mediaRecorder.stop()
  }

  const handlePauseRecording = () => {
    if (onPauseRecording) {
      onPauseRecording()
    }

    if (!mediaRecorder) {
      handleError(new ReactVideoRecorderMediaRecorderUnavailableError())
      return
    }

    mediaRecorder.pause()
  }

  const handleResumeRecording = () => {
    if (onResumeRecording) {
      onResumeRecording()
    }

    if (!mediaRecorder) {
      handleError(new ReactVideoRecorderMediaRecorderUnavailableError())
      return
    }

    mediaRecorder.resume()
  }

  const handleStartRecording = () => {
    if (onStartRecording) {
      onStartRecording()
    }

    setState({
      ...state,
      isRunningCountdown: true,
      isReplayingVideo: false
    })

    setTimeout(() => startRecording(), countdownTime)
  }

  const startRecording = () => {
    captureThumb(cameraVideo).then((thumbnail) => {
      thumbnail = thumbnail

      recordedBlobs.length = 0
      const options = {
        mimeType: getMimeType()
      }

      try {
        setState({
          ...state,
          isRunningCountdown: false,
          isRecording: true
        })
        startedAt = new Date().getTime()
        mediaRecorder = new MediaRecorder(state.stream, options)
        mediaRecorder.addEventListener('stop', handleStop)
        mediaRecorder.addEventListener('error', handleError)
        mediaRecorder.addEventListener(
          'dataavailable',
          handleDataAvailable
        )

        mediaRecorder.start(chunkSize) // collect 10ms of data

        if (timeLimit) {
          setTimeout(() => {
            handleStopRecording()
          }, timeLimit)
        }

        // mediaRecorder.ondataavailable should be called every 10ms,
        // as that's what we're passing to mediaRecorder.start() above
        if (Number.isInteger(dataAvailableTimeout)) {
          setTimeout(() => {
            if (recordedBlobs.length === 0) {
              handleError(
                new ReactVideoRecorderDataAvailableTimeoutError(
                  dataAvailableTimeout
                )
              )
            }
          }, dataAvailableTimeout)
        }
      } catch (err) {
        console.error("Couldn't create MediaRecorder", err, options)
        handleError(err)
      }
    })
  }

  const handleStop = (event: any) => {
    const endedAt = new Date().getTime()

    if (!recordedBlobs || recordedBlobs.length <= 0) {
      const error = new ReactVideoRecorderRecordedBlobsUnavailableError(event)
      console.error(error.message, event)
      handleError(error)
      return
    }

    clearTimeout()

    const videoBlob =
      recordedBlobs.length === 1
        ? recordedBlobs[0]
        : new window.Blob(recordedBlobs, {
          type: getMimeType()
        })

    const thumbnailBlob = thumbnail
    const duration = endedAt - startedAt

    // if this gets executed too soon, the last chunk of data is lost on FF
    mediaRecorder.ondataavailable = null

    fixVideoMetadata(videoBlob).then((fixedVideoBlob: any) => {
      setState({
        ...state,
        isRecording: false,
        isReplayingVideo: true,
        isReplayVideoMuted: true,
        ...fixedVideoBlob,
        videoUrl: window.URL.createObjectURL(fixedVideoBlob)
      })

      turnOffCamera()

      if(onRecordingComplete)
      onRecordingComplete(
        fixedVideoBlob,
        startedAt,
        thumbnailBlob,
        duration
      )
    })
  }

  // see https://bugs.chromium.org/p/chromium/issues/detail?id=642012
  const fixVideoMetadata = (rawVideoBlob: any) => {
    // see https://stackoverflow.com/a/63568311
    // Blob.prototype.arrayBuffer ??= () => {
    //   return new Response(this).arrayBuffer()
    // }
    if('arrayBuffer' in rawVideoBlob) {return new Response(this).arrayBuffer()}

    return rawVideoBlob.arrayBuffer().then((buffer: ArrayBuffer) => {
      const decoder = new Decoder()
      const elements = decoder.decode(buffer)

      const reader = new Reader()
      reader.logging = false
      reader.drop_default_duration = false
      elements.forEach((element) => reader.read(element))
      reader.stop()

      const seekableMetadata = tools.makeMetadataSeekable(
        reader.metadatas,
        reader.duration,
        reader.cues
      )

      const blobBody = buffer.slice(reader.metadataSize)

      const result = new Blob([seekableMetadata, blobBody], {
        type: rawVideoBlob.type
      })

      return result
    })
  }

  const handleVideoSelected = (e: any) => {
    if (state.isReplayingVideo) {
      setState({
        ...state,
        isReplayingVideo: false
      })
    }

    const files = e.target.files || e.dataTransfer.files
    if (files.length === 0) return

    const startedAt = new Date().getTime()
    const video = files[0]

    e.target.value = null

    const extension = video.type === 'video/quicktime' ? 'mov' : undefined

    getVideoInfo(video)
      .then(({duration, thumbnail}: any) => {
        setState({
          ...state,
          isRecording: false,
          isReplayingVideo: true,
          isReplayVideoMuted: true,
          videoUrl: window.URL.createObjectURL(video),
          videoBlob: video,
        })

        if(onRecordingComplete)
        onRecordingComplete(
          video,
          startedAt,
          thumbnail,
          duration,
          extension
        )
      })
      .catch((err) => {
        handleError(err)
      })
  }

  const handleOpenVideoInput = () => {
    if (onOpenVideoInput) {
      onOpenVideoInput()
    }

    if (videoInput) {
      videoInput.value = ''
      videoInput.click()

      // fixes a bug on iPhone where it doesn't save the recorded video on the second time (if you press the 'Use another video' button)
      videoInput.addEventListener('change', handleVideoSelected)
    }
  }

  const handleStopReplaying = () => {
    if (onStopReplaying) {
      onStopReplaying()
    }

    if (useVideoInput && isOnInitially) {
      return handleOpenVideoInput()
    }

    setState({
      ...state,
      isReplayingVideo: false
    })

    if (state.isInlineRecordingSupported && isOnInitially) {
     turnOnCamera()
    } else if (state.isVideoInputSupported && isOnInitially) {
      handleOpenVideoInput()
    }
  }

  const handleReplayVideoClick = () => {
    if (replayVideo && replayVideo.paused && !showReplayControls) {
      replayVideo.play()
    }

    // fixes bug where seeking control during autoplay is not available until the video is almost completely played through
    if (!replayVideoAutoplayAndLoopOff) {
      setState({
        ...state,
        isReplayVideoMuted: !state.isReplayVideoMuted
      })
    }
  }

  const renderCameraView: React.FC<IRenderCameraView> = ({
    isVideoInputSupported,
    isReplayingVideo,
    isInlineRecordingSupported,
    thereWasAnError,
    error,
    isCameraOn,
    isConnecting,
    isReplayVideoMuted
  }) => {
    const shouldUseVideoInput =
      useVideoInput || (!isInlineRecordingSupported && isVideoInputSupported)

    const videoInput = shouldUseVideoInput ? (
      <input
        ref={(ref: HTMLInputElement | null) => setVideoInput(ref)}
        key='videoInput'
        type='file'
        accept='video/*'
        capture={useVideoInput ? undefined : 'user'}
        style={{ display: 'none' }}
        onChange={handleVideoSelected}
      />
    ) : null

    if (isReplayingVideo) {
      return (
        <div className='rvr-camera' key='replay'>
          <video
            className='rvr-video'
            ref={(ref: HTMLVideoElement | null) => setReplayVideo(ref)}
            src={state.videoUrl}
            loop
            muted={isReplayVideoMuted}
            playsInline
            autoPlay={!replayVideoAutoplayAndLoopOff}
            controls={showReplayControls}
            onClick={handleReplayVideoClick}
            // onDurationChange={handleDurationChange}
          />
          {videoInput}
        </div>
      )
    }

    if (shouldUseVideoInput) {
      return renderVideoInputView({ videoInput })
    }

    if (!isInlineRecordingSupported) {
      return renderUnsupportedView()
    }

    if (thereWasAnError) {
      return renderErrorView({ error })
    }

    if (isCameraOn) {
      return (
        <div className='rvr-camera' key='camera'>
          <video
            className='rvr-video'
            // isFlipped={this.props.isFlipped}
            ref={ref => setCameraVideo(ref)}
            autoPlay
            muted
          />
        </div>
      )
    }

    if (isConnecting) {
      return renderLoadingView()
    }

    return renderDisconnectedView()
  }

    return (
      <div className='rvr-wrapper'>
        {renderCameraView({
          isVideoInputSupported: state.isVideoInputSupported,
          isInlineRecordingSupported: state.isInlineRecordingSupported,
          thereWasAnError: state.thereWasAnError,
          isCameraOn: state.isCameraOn,
          isConnecting: state.isConnecting,
          isReplayingVideo: state.isReplayingVideo,
          isReplayVideoMuted: state.isReplayVideoMuted,
          error: state.error
        })}
        {renderActions({
          isVideoInputSupported: state.isVideoInputSupported,
          isInlineRecordingSupported: state.isInlineRecordingSupported,
          thereWasAnError: state.thereWasAnError,
          isRecording: state.isRecording,
          isCameraOn: state.isCameraOn,
          streamIsReady: state.streamIsReady,
          isConnecting: state.isConnecting,
          isRunningCountdown: state.isRunningCountdown,
          isReplayingVideo: state.isReplayingVideo,
          isReplayVideoMuted: state.isReplayVideoMuted,
          countdownTime,
          timeLimit,
          showReplayControls,
          replayVideoAutoplayAndLoopOff,
          useVideoInput,

          onTurnOnCamera: turnOnCamera,
          onTurnOffCamera: turnOffCamera,
          onOpenVideoInput: handleOpenVideoInput,
          onStartRecording: handleStartRecording,
          onStopRecording: handleStopRecording,
          onPauseRecording: handlePauseRecording,
          onResumeRecording: handleResumeRecording,
          onStopReplaying: handleStopReplaying
        })}
      </div>
    )
}

export default VideoRecorder
