export enum ErrorMessage {
  AbortedSignalWithoutMessage = 'signal is aborted without message',
  RequestTimedout = 'the request timed out and an automatic abort occurred',
  CancelRequest = 'cancellation of the previous AbortController'
}
