// Public API of the engine layer: `Engine` interface, Stockfish worker adapter, UCI client.
export type {
  AnalyzeOptions,
  BestMoveEvent,
  Engine,
  EngineBounds,
  EngineDescriptor,
  EngineEvent,
  EngineSettings,
  EngineStatus,
  InfoEvent,
  LoadProgress,
  Search,
  SearchEndReason,
  SearchEvent,
  SearchId,
  SearchInfo,
  SearchLimits,
} from './types'
export {
  detectCapabilities,
  engineBounds,
  fullEngineWarnings,
  recommendedSettings,
  type CapabilityEnvironment,
  type EngineCapabilities,
  type FullEngineWarning,
} from './capabilities'
export { UciClient, type UciIdentity, type UciTransport } from './uci/client'
export { UciEngine, type ConnectContext, type UciEngineConfig } from './uci/uci-engine'
export { parseLine } from './uci/parse'
export type { UciInfo, UciMessage, UciOption } from './uci/messages'
export { ENGINE_DOWNLOAD_BYTES, type EngineSize } from './stockfish/files'
export { createStockfishEngine, type StockfishEngineOptions } from './stockfish/stockfish-engine'
