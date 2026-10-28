import { delay, HttpResponse } from 'msw'

export type NetworkFailure = { kind: 'network' } | { kind: 'http'; status: number }
type Scenario = { variableLatency?: boolean; latencySequence?: number[]; emptyCatalog?: boolean }

const failures = new Map<string, NetworkFailure[]>()
const latencySequences = new Map<string, number>()
let scenario: Scenario = {}

export function configureNetworkScenario(next: Scenario) {
  scenario = { ...next }
}

export function queueNetworkFailure(route: string, failure: NetworkFailure, count = 1) {
  failures.set(route, [...(failures.get(route) ?? []), ...Array.from({ length: count }, () => failure)])
}

export function resetNetworkScenarios() {
  scenario = {}
  failures.clear()
  latencySequences.clear()
}

export async function scenarioDelay(request: Request, route: string, baseMs: number) {
  const requested = Number(new URL(request.url).searchParams.get('__delay'))
  if (Number.isFinite(requested) && requested >= 0) return delay(Math.min(requested, 5000))
  if (!scenario.variableLatency && !scenario.latencySequence?.length) return delay(baseMs)
  const sequence = scenario.latencySequence?.length ? scenario.latencySequence : [280, 35, 140]
  const index = latencySequences.get(route) ?? 0
  latencySequences.set(route, index + 1)
  return delay(sequence[index % sequence.length]!)
}

export function takeNetworkFailure(route: string) {
  const next = failures.get(route)?.shift()
  if (!next) return null
  if (failures.get(route)?.length === 0) failures.delete(route)
  return next.kind === 'network' ? HttpResponse.error() : HttpResponse.json({ message: 'Falha simulada de rede.' }, { status: next.status })
}

export function shouldReturnEmptyCatalog() {
  return scenario.emptyCatalog === true
}

if (typeof window !== 'undefined') {
  const target = window as unknown as Record<string, unknown>
  target.__kurioConfigureNetwork = configureNetworkScenario
  target.__kurioQueueNetworkFailure = queueNetworkFailure
  target.__kurioResetNetwork = resetNetworkScenarios
}
