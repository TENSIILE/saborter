export interface OriginalSignalApi {
  addEventListener: AbortSignal['addEventListener'];
  removeEventListener: AbortSignal['removeEventListener'];
}

export interface OriginalSignalListenerParams {
  type: Parameters<AbortSignal['addEventListener']>['0'];
  listener: Parameters<AbortSignal['addEventListener']>['1'];
  options: Parameters<AbortSignal['addEventListener']>['2'];
}
