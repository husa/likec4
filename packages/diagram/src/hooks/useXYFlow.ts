import { useCallbackRef } from '@mantine/hooks'
import {
  type ReactFlowInstance,
  type ReactFlowState,
  useInternalNode,
  useReactFlow,
  useStore,
  useStoreApi,
} from '@xyflow/react'
import { shallowEqual } from 'fast-equals'
import type { Types } from '../likec4diagram/types'

export const useXYFlow = useReactFlow<Types.Node, Types.Edge>
export type XYFlowInstance = ReactFlowInstance<Types.Node, Types.Edge>

export function useXYStore<StateSlice = unknown>(
  selector: (state: ReactFlowState<Types.Node, Types.Edge>) => StateSlice,
  equalityFn?: (a: NoInfer<StateSlice>, b: NoInfer<StateSlice>) => boolean,
): StateSlice {
  return useStore(
    useCallbackRef(selector as any),
    equalityFn ?? shallowEqual,
  )
}

export const useXYStoreApi = useStoreApi<Types.Node, Types.Edge>
export type XYStoreApi = ReturnType<typeof useXYStoreApi>

export const useXYInternalNode = useInternalNode<Types.Node>

const selectCurrentZoom = (state: ReactFlowState) => Math.round(state.transform[2] * 100) / 100
export function useCurrentZoom(): number {
  return useStore(selectCurrentZoom)
}

const selectZoom = (state: ReactFlowState) => state.transform[2] < 0.2
export function useIsZoomTooSmall(): boolean {
  return useStore(selectZoom)
}
