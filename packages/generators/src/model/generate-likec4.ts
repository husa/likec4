import {
  DefaultElementShape,
  DefaultThemeColor,
  type Element,
  type ElementKindSpecification,
  type ElementKindSpecificationStyle,
  invariant,
  nameFromFqn,
  type NonEmptyArray,
  parentFqn,
  type ParsedLikeC4Model
} from '@likec4/core'
import {
  CompositeGeneratorNode,
  expandToNode,
  type GeneratorNode,
  joinToNode,
  NL,
  NLEmpty,
  toString
} from 'langium/generate'
import { entries, isEmpty, isTruthy, pick, pickBy, values } from 'remeda'

const QUOTE = '\''

const printStringProperty = (key: string, value: string) => {
  const out = new CompositeGeneratorNode()
  const v = value.replaceAll(QUOTE, '"')
  out.append(`${key} `)
  if (!value.includes('\n')) {
    return out.append(QUOTE, v, QUOTE)
  }
  return out
    .append(QUOTE)
    .appendNewLine()
    .indent({
      indentedChildren: [
        joinToNode(
          v.split('\n'),
          String,
          { separator: NL }
        )
      ],
      indentEmptyLines: true
    })
    .appendNewLineIfNotEmpty()
    .append(QUOTE)
}

const printStyle = (style: ElementKindSpecificationStyle) => {
  return new CompositeGeneratorNode()
    .append(`style {`, NL)
    .indent([
      joinToNode(
        entries(style),
        ([key, value]) => `${key} ${value}${key === 'opacity' ? '%' : ''}`,
        { appendNewLineIfNotEmpty: true }
      )
    ])
    .appendNewLineIfNotEmpty()
    .append('}')
}

const printElementKind = (kind: string, spec: ElementKindSpecification) => {
  const out = new CompositeGeneratorNode()
  out.append(`element ${kind}`)
  const lines = [] as CompositeGeneratorNode[]
  if (isTruthy(spec.technology)) {
    lines.push(printStringProperty('technology', spec.technology).appendNewLine())
  }
  if (isTruthy(spec.notation)) {
    lines.push(printStringProperty('notation', spec.notation).appendNewLine())
  }
  if (!isEmpty(spec.style)) {
    lines.push(printStyle(spec.style).appendNewLine())
  }

  if (lines.length === 0) {
    return out.append(' {}')
  }

  return out
    .append(' {', NL)
    .indent({
      indentedChildren: lines,
      indentEmptyLines: true
    })
    .appendNewLineIfNotEmpty()
    .append('}')
}

const printSpecification = ({
  elements,
  relationships,
  tags,
  ...unexpected
}: ParsedLikeC4Model['specification']) => {
  invariant(isEmpty(unexpected), 'Unexpected properties in specification')
  return new CompositeGeneratorNode()
    .append(`specification {`, NL)
    .indent({
      indentedChildren: nd =>
        nd
          .append(
            joinToNode(
              entries(elements),
              ([kind, spec]) => printElementKind(kind, spec),
              { appendNewLineIfNotEmpty: true }
            )
          )
          .appendNewLineIfNotEmpty()
          .appendIf(tags.length > 0, nd =>
            nd.append(
              joinToNode(tags, tag => `tag ${tag}`, { appendNewLineIfNotEmpty: true })
            )),
      indentEmptyLines: true
    })
    .appendNewLineIfNotEmpty()
    .append('}')
}

const printTags = (tags: NonEmptyArray<string>): CompositeGeneratorNode => {
  return joinToNode(tags, tag => `#${tag}`, { separator: ', ' })!
}

type PrintModelData = Pick<ParsedLikeC4Model, 'elements' | 'specification'>
const printElement = (el: Element, model: PrintModelData): CompositeGeneratorNode => {
  const kindSpec = model.specification.elements[el.kind]!
  const children = values(pickBy(model.elements, e => parentFqn(e.id) === el.id))
  const out = expandToNode`
    ${nameFromFqn(el.id)} = ${el.kind} '${el.title.replace(QUOTE, '"')}'
  `

  const lines = [] as GeneratorNode[]
  if (isTruthy(el.tags)) {
    lines.push(printTags(el.tags))
  }

  if (isTruthy(el.technology) && el.technology !== kindSpec.technology) {
    lines.push(printStringProperty('technology', el.technology))
  }
  if (isTruthy(el.description)) {
    lines.push(printStringProperty('description', el.description))
  }
  // TODO: links
  // TODO: metadata

  const style = {
    ...el.style,
    ...pick(el, ['shape', 'icon', 'color'])
  }
  // remove default values or values from specification
  if (style.shape === DefaultElementShape || style.shape === kindSpec.style.shape) {
    delete style.shape
  }
  if (style.icon === kindSpec.style.icon) {
    delete style.icon
  }
  if (style.color === DefaultThemeColor || style.color === kindSpec.style.color) {
    delete style.color
  }
  if (style.opacity === kindSpec.style.opacity) {
    delete style.opacity
  }
  if (style.border === kindSpec.style.border) {
    delete style.border
  }

  if (!isEmpty(style)) {
    lines.push(printStyle(style))
  }

  if (children.length > 0) {
    children.forEach(child => {
      if (lines.length > 0) {
        lines.push(NL)
      }
      lines.push(printElement(child, model))
    })
  }

  if (lines.length === 0) {
    return out.append(' {}')
  }

  return out
    .append(' {', NL)
    .indent({
      indentedChildren: [
        joinToNode(
          lines,
          { separator: NLEmpty }
        )
      ],
      indentEmptyLines: true
    })
    .appendNewLineIfNotEmpty()
    .append('}')
}

const printModel = (model: PrintModelData): CompositeGeneratorNode => {
  return new CompositeGeneratorNode()
    .append('model {', NL)
    .indent({
      indentedChildren: [
        joinToNode(
          values(model.elements).filter(e => !parentFqn(e.id)),
          el => printElement(el, model),
          { separator: NL }
        )
      ],
      indentEmptyLines: true
    })
    .appendNewLineIfNotEmpty()
    .append('}')
}

export function generateLikeC4({
  specification,
  elements,
  globals,
  relations,
  views,
  ...unexpected
}: ParsedLikeC4Model) {
  invariant(isEmpty(unexpected), 'Unexpected properties in model')
  return toString(
    printSpecification(specification)
      .appendIf(!isEmpty(elements), NL, printModel({ elements, specification }))
      .appendNewLineIfNotEmpty(),
    // joinToNode(
    //   [
    //     printSpecification(specification),
    //      && printModel(values(elements))
    //   ],
    //   { separator: NL }
    // )?.appendNewLineIfNotEmpty(),
    2
  )
}
