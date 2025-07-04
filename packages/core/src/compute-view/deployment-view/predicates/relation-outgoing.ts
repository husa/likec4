import { anyPass, filter, pipe } from 'remeda'
import type { AnyAux, LikeC4DeploymentModel, RelationshipModel } from '../../../model'
import { type RelationExpr, FqnExpr } from '../../../types'
import { invariant, isAncestor } from '../../../utils'
import type { Connection, Elem, PredicateExecutor } from '../_types'
import { findConnection, findConnectionsBetween, resolveElements, resolveModelElements } from '../utils'
import { resolveAscendingSiblings } from './relation-direct'
import { applyPredicate, excludeModelRelations } from './utils'

export const OutgoingRelationPredicate: PredicateExecutor<RelationExpr.Outgoing> = {
  include: ({ expr, model, memory, stage, where }) => {
    const targets = [...memory.elements]

    // * -> (to visible elements)
    // outgoing from wildcard to visible element
    if (FqnExpr.isWildcard(expr.outgoing)) {
      for (const target of targets) {
        if (target.allIncoming.isEmpty) {
          continue
        }
        for (const source of resolveAscendingSiblings(target)) {
          const toInclude = applyPredicate(findConnection(source, target, 'directed'), where)
          stage.addConnections(toInclude)
        }
      }
      return stage
    }
    invariant(FqnExpr.isDeploymentRef(expr.outgoing), 'Only deployment refs are supported in include')

    const sources = resolveElements(model, expr.outgoing)
    for (const source of sources) {
      const toInclude = applyPredicate(findConnectionsBetween(source, targets, 'directed'), where)
      stage.addConnections(toInclude)
    }

    return stage
  },
  exclude: ({ expr, model, memory, stage, where }) => {
    if (FqnExpr.isElementTagExpr(expr.outgoing) || FqnExpr.isElementKindExpr(expr.outgoing)) {
      throw new Error('element kind and tag expressions are not supported in exclude')
    }
    // Exclude all connections that have model relationshps with the elements
    if (FqnExpr.isModelRef(expr.outgoing)) {
      const excludedRelations = resolveAllOutgoingRelations(model, expr.outgoing)
      return excludeModelRelations(excludedRelations, { stage, memory }, where)
    }
    if (FqnExpr.isWildcard(expr.outgoing)) {
      // non-sense
      return stage
    }

    const isOutgoing = filterOutgoingConnections(resolveElements(model, expr.outgoing))
    const toExclude = pipe(
      memory.connections,
      filter(isOutgoing),
      applyPredicate(where),
    )
    stage.excludeConnections(toExclude)
    return stage
  },
}

export function filterOutgoingConnections(
  sources: Elem[],
): (connection: Connection) => boolean {
  return anyPass(
    sources.map(source => {
      const satisfies = (el: Elem) => el === source || isAncestor(source, el)
      return (connection: Connection) => {
        return satisfies(connection.source) && !satisfies(connection.target)
      }
    }),
  )
  // if (FqnExpr.isDeploymentRef(expr) && isNullish(expr.selector)) {
  //   // element ->
  //   const source = model.element(expr.ref.deployment)
  //   const isInside = (el: Elem) => el === source || isAncestor(source, el)
  //   return (connection: Connection) => {
  //     return isInside(connection.source) && !isInside(connection.target)
  //   }
  // } else {
  //   const isSource = deploymentExpressionToPredicate(expr)
  //   return (connection: Connection) => {
  //     return isSource(connection.source)
  //   }
  // }
}

export function resolveAllOutgoingRelations<A extends AnyAux>(
  model: LikeC4DeploymentModel<A>,
  moodelRef: FqnExpr.ModelRef<A>,
): Set<RelationshipModel<A>> {
  const targets = resolveModelElements(model, moodelRef)
  return new Set(targets.flatMap(e => [...e.allOutgoing]))
}
