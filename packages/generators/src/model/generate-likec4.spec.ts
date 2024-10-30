import { Builder } from '@likec4/core'
import { test } from 'vitest'
import { generateLikeC4 } from './generate-likec4'

test('printSpecification', async ({ expect }) => {
  const model = Builder
    .forSpecification({
      elements: {
        'empty': {},
        'db': {
          style: {
            shape: 'storage'
          }
        },
        'withOpacity': {
          technology: 'tech1',
          notation: 'note1',
          style: {
            color: 'red',
            opacity: 50
          }
        },
        'multiline': {
          technology: '',
          notation: [
            'line1',
            '',
            'line2'
          ].join('\n')
        }
      },
      tags: ['tag1', 'tag2', 'next']
    })
    .builder.build()
  expect(generateLikeC4(model)).toMatchSnapshot()
})

test('print model', async ({ expect }) => {
  const {
    builder,
    model: {
      model,
      actor,
      system,
      component
    }
  } = Builder
    .forSpecification({
      elements: {
        'actor': {
          style: {
            shape: 'person'
          }
        },
        'system': {},
        'component': {
          style: {
            color: 'secondary'
          }
        }
      },
      tags: ['next', 'api']
    })
  const m = builder.with(
    model(
      actor('alice'),
      system('cloud', {
        title: 'Cloud',
        description: 'The cloud',
        tags: ['next']
      }).with(
        component('ui').with(
          component('dashboard', {
            icon: 'tech:react',
            technology: 'React',
            shape: 'browser'
          })
        ),
        component('backend', {
          title: 'Cloud Backend',
          description: 'Backend services'
        }).with(
          component('api', {
            title: 'API',
            technology: 'GraphQL',
            color: 'green',
            tags: ['api', 'next']
          })
        )
      )
    )
  ).build()
  expect(generateLikeC4(m)).toMatchSnapshot()
})
