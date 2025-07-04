import type { DeploymentFqn, DiagramEdge, DiagramNode, Fqn, IconUrl, RichTextOrEmpty, ViewId } from '@likec4/core/types'
import type { XYPosition } from '@xyflow/system'
import type { OptionalKeysOf, Simplify } from 'type-fest'
import type { Base, ReactFlowEdge, ReactFlowNode } from '../base/types'

type NonOptional<T extends object> = Simplify<
  & {
    [P in Exclude<keyof T, OptionalKeysOf<T>>]: T[P]
  }
  & {
    [P in OptionalKeysOf<T>]-?: T[P] | undefined
  }
>

export namespace Types {
  export type LeafNodeData =
    & Base.NodeData
    & NonOptional<
      Pick<
        DiagramNode,
        | 'id'
        | 'title'
        | 'technology'
        | 'color'
        | 'shape'
        | 'width'
        | 'level'
        | 'height'
        | 'style'
        | 'tags'
        | 'position'
      >
    >
    & {
      description: RichTextOrEmpty
      /**
       * View this node belongs to
       */
      viewId: ViewId
      isMultiple?: boolean | undefined
      icon: string | null
    }

  /**
   * Represents element from logical model
   */
  export type ElementNodeData = LeafNodeData & {
    modelFqn: Fqn
    deploymentFqn?: never
    /**
     * If set - this node has navigation to another view and diagram has handler for this
     */
    navigateTo: ViewId | null
  }

  /**
   * Represents element from deployment model
   */
  export type DeploymentElementNodeData =
    & LeafNodeData
    & {
      navigateTo: ViewId | null
      deploymentFqn: DeploymentFqn
      // If set - this node refers to a model element
      modelFqn: Fqn | null
    }

  export type CompoundNodeData =
    & Base.NodeData
    & NonOptional<
      Pick<
        DiagramNode,
        | 'id'
        | 'title'
        | 'color'
        | 'shape'
        | 'style'
        | 'tags'
        | 'position'
      >
    >
    & {
      /**
       * View this node belongs to
       */
      viewId: ViewId
      depth: number
      icon?: IconUrl
    }

  export type CompoundElementNodeData = CompoundNodeData & {
    modelFqn: Fqn
    deploymentFqn?: never
    /**
     * If set - this node has navigation to another view and diagram has handler for this
     */
    navigateTo: ViewId | null
  }

  export type CompoundDeploymentNodeData = CompoundNodeData & {
    deploymentFqn: DeploymentFqn
    /**
     * If set - this node refers to a model element
     */
    modelFqn: Fqn | null
    /**
     * If set - this node has navigation to another view and diagram has handler for this
     */
    navigateTo: ViewId | null
  }

  export type ViewGroupNodeData = CompoundNodeData & {
    isViewGroup: true
  }

  // export type CompoundNode = ReactFlowNode<CompoundNodeData, 'compound'>

  export type ElementNode = ReactFlowNode<ElementNodeData, 'element'>
  export type DeploymentElementNode = ReactFlowNode<DeploymentElementNodeData, 'deployment'>
  export type CompoundElementNode = ReactFlowNode<CompoundElementNodeData, 'compound-element'>
  export type CompoundDeploymentNode = ReactFlowNode<CompoundDeploymentNodeData, 'compound-deployment'>
  export type ViewGroupNode = ReactFlowNode<ViewGroupNodeData, 'view-group'>

  export type Node = ElementNode | DeploymentElementNode | CompoundElementNode | CompoundDeploymentNode | ViewGroupNode

  export type NodeData = Node['data']

  export type RelationshipEdgeData = Simplify<
    & Base.EdgeData
    & NonOptional<
      Pick<
        DiagramEdge,
        | 'id'
        | 'label'
        | 'labelBBox'
        | 'technology'
        | 'points'
        | 'dir'
        | 'color'
        | 'line'
        | 'head'
        | 'tail'
        | 'navigateTo'
        | 'notes'
      >
    >
    & {
      labelXY: XYPosition | null
      controlPoints: XYPosition[] | undefined | null
    }
  >

  export type RelationshipEdge = ReactFlowEdge<RelationshipEdgeData, 'relationship'>

  export type Edge = RelationshipEdge
  export type EdgeData = RelationshipEdgeData
}
