class ReactVideoRecorderError extends Error {
  event: any
  dataAvailableTimeout: any
}

export class ReactVideoRecorderDataIssueError extends ReactVideoRecorderError {
  constructor (event: any) {
    super("Couldn't get data from event")
    this.name = 'ReactVideoRecorderDataIssueError'
    this.event = event
  }
}

export class ReactVideoRecorderRecordedBlobsUnavailableError extends ReactVideoRecorderError {
  constructor (event: Error) {
    super("Couldn't get recordedBlobs")
    this.name = 'ReactVideoRecorderRecordedBlobsUnavailableError'
    this.event = event
  }
}

export class ReactVideoRecorderDataAvailableTimeoutError extends ReactVideoRecorderError {
  constructor (dataAvailableTimeout: any) {
    super(
      `Method mediaRecorder.ondataavailable wasn't called after ${dataAvailableTimeout}ms`
    )
    this.name = 'ReactVideoRecorderDataAvailableTimeoutError'
    this.dataAvailableTimeout = dataAvailableTimeout
  }
}

export class ReactVideoRecorderMediaRecorderUnavailableError extends ReactVideoRecorderError {
  constructor () {
    super("Couldn't get mediaRecorder")
    this.name = 'ReactVideoRecorderMediaRecorderUnavailableError'
  }
}
