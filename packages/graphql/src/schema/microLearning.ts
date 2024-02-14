import * as DB from '@klicker-uzh/prisma'
import builder from '../builder'
import type { ICourse } from './course'
import { CourseRef } from './course'
import { ElementStackRef, IElementStack } from './practiceQuizzes'

export interface IMicroLearning extends DB.MicroLearning {
  course?: ICourse | null
  stacks?: IElementStack[]
}

export const MicroLearningStatus = builder.enumType('MicroLearningStatus', {
  values: Object.values(DB.MicroLearningStatus),
})

export const MicroLearningRef =
  builder.objectRef<IMicroLearning>('MicroLearning')
export const MicroLearning = MicroLearningRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),

    name: t.exposeString('name'),
    displayName: t.exposeString('displayName'),
    status: t.expose('status', { type: MicroLearningStatus }),
    description: t.exposeString('description', { nullable: true }),
    pointsMultiplier: t.exposeFloat('pointsMultiplier'),

    scheduledStartAt: t.expose('scheduledStartAt', { type: 'Date' }),
    scheduledEndAt: t.expose('scheduledEndAt', { type: 'Date' }),
    arePushNotificationsSent: t.exposeBoolean('arePushNotificationsSent'),

    course: t.expose('course', {
      type: CourseRef,
      nullable: true,
    }),
    stacks: t.expose('stacks', {
      type: [ElementStackRef],
      nullable: true,
    }),
  }),
})
