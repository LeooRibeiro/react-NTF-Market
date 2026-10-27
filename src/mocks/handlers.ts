import { socketIoHandler, updateNftPrice, updateNftAvailability, updateOrderStatus, broadcastSocketEvent, resetMockDatabase, activeSocketClients } from './socket-handlers'
import { accountHandlers } from './account-handlers'
import { orderHandlers } from './order-handlers'
import { catalogHandlers } from './catalog-handlers'
import { cartHandlers } from './cart-handlers'
import { authHandlers } from './auth-handlers'

export { updateNftPrice, updateNftAvailability, updateOrderStatus, broadcastSocketEvent, resetMockDatabase, activeSocketClients }
export type { Wallet, ProfileData } from './mock-data'

/** Combina handlers simulados separados por área da aplicação. */
export const handlers = [
  socketIoHandler,
  ...accountHandlers,
  ...orderHandlers,
  ...catalogHandlers,
  ...cartHandlers,
  ...authHandlers,
]
