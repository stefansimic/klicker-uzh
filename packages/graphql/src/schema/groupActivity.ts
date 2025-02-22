import * as DB from '@klicker-uzh/prisma'
import builder from '../builder.js'
import type { ICourse } from './course.js'
import { Course } from './course.js'
import type { IParticipant, IParticipantGroup } from './participant.js'
import { ParticipantGroupRef, ParticipantRef } from './participant.js'
import type { IQuestionInstance } from './question.js'
import { QuestionInstanceRef } from './question.js'

export const ParameterType = builder.enumType('ParameterType', {
  values: Object.values(DB.ParameterType),
})

export const GroupActivityDecisionInput = builder.inputType(
  'GroupActivityDecisionInput',
  {
    fields: (t) => ({
      id: t.int({ required: true }),

      selectedOptions: t.intList({ required: false }),
      response: t.string({ required: false }),
    }),
  }
)

export interface IGroupActivity extends DB.GroupActivity {}
export const GroupActivityRef =
  builder.objectRef<IGroupActivity>('GroupActivity')
export const GroupActivity = GroupActivityRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),

    name: t.exposeString('name'),
    displayName: t.exposeString('displayName'),
    description: t.exposeString('description', { nullable: true }),

    scheduledStartAt: t.expose('scheduledStartAt', { type: 'Date' }),
    scheduledEndAt: t.expose('scheduledEndAt', { type: 'Date' }),
  }),
})

export interface IGroupActivityInstance extends DB.GroupActivityInstance {
  clues?: IGroupActivityClueInstance[]
}
export const GroupActivityInstanceRef =
  builder.objectRef<IGroupActivityInstance>('GroupActivityInstance')
export const GroupActivityInstance = GroupActivityInstanceRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id'),
    decisions: t.expose('decisions', { type: 'Json', nullable: true }),
    decisionsSubmittedAt: t.expose('decisionsSubmittedAt', {
      type: 'Date',
      nullable: true,
    }),
    results: t.expose('results', { type: 'Json', nullable: true }),
    clues: t.expose('clues', {
      type: [GroupActivityClueInstanceRef],
      nullable: true,
    }),
    groupActivityId: t.exposeID('groupActivityId'),
  }),
})

export const GroupActivityClueRef =
  builder.objectRef<DB.GroupActivityClue>('GroupActivityClue')
export const GroupActivityClue = GroupActivityClueRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id'),

    name: t.exposeString('name'),
    displayName: t.exposeString('displayName'),
  }),
})

export interface IGroupActivityClueInstance
  extends DB.GroupActivityClueInstance {
  participant: IParticipant
}
export const GroupActivityClueInstanceRef =
  builder.objectRef<IGroupActivityClueInstance>('GroupActivityClueInstance')
export const GroupActivityClueInstance = GroupActivityClueInstanceRef.implement(
  {
    fields: (t) => ({
      id: t.exposeInt('id'),

      name: t.exposeString('name'),
      displayName: t.exposeString('displayName'),
      type: t.expose('type', { type: ParameterType }),
      unit: t.exposeString('unit', { nullable: true }),
      value: t.exposeString('value', { nullable: true }),

      participant: t.expose('participant', {
        type: ParticipantRef,
      }),
    }),
  }
)

export const GroupActivityClueAssignmentRef =
  builder.objectRef<DB.GroupActivityClueAssignment>(
    'GroupActivityClueAssignment'
  )
export const GroupActivityClueAssignment =
  GroupActivityClueAssignmentRef.implement({
    fields: (t) => ({
      id: t.exposeInt('id'),
    }),
  })

export const GroupActivityParameterRef =
  builder.objectRef<DB.GroupActivityParameter>('GroupActivityParameter')
export const GroupActivityParameter = GroupActivityParameterRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id'),
  }),
})

export interface IGroupActivityDetails {
  id: string
  name: string
  displayName: string
  description?: string | null
  scheduledStartAt?: Date
  scheduledEndAt?: Date
  group: IParticipantGroup
  course: ICourse
  activityInstance?: DB.GroupActivityInstance | null
  clues: DB.GroupActivityClue[]
  instances: IQuestionInstance[]
}
export const GroupActivityDetailsRef = builder.objectRef<IGroupActivityDetails>(
  'GroupActivityDetails'
)
export const GroupActivityDetails = GroupActivityDetailsRef.implement({
  fields: (t) => ({
    id: t.exposeString('id'),

    name: t.exposeString('name', { nullable: false }),
    displayName: t.exposeString('displayName', { nullable: false }),
    description: t.exposeString('description', { nullable: true }),

    scheduledStartAt: t.expose('scheduledStartAt', {
      type: 'Date',
      nullable: true,
    }),
    scheduledEndAt: t.expose('scheduledEndAt', {
      type: 'Date',
      nullable: true,
    }),

    activityInstance: t.expose('activityInstance', {
      type: GroupActivityInstanceRef,
      nullable: true,
    }),

    clues: t.expose('clues', {
      type: [GroupActivityClueRef],
    }),

    instances: t.expose('instances', {
      type: [QuestionInstanceRef],
    }),

    course: t.expose('course', {
      type: Course,
    }),

    group: t.expose('group', {
      type: ParticipantGroupRef,
    }),
  }),
})
