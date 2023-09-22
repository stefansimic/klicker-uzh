import * as DB from '@klicker-uzh/prisma'
import dayjs from 'dayjs'
import builder from '../builder.js'
import { GroupActivity } from './groupActivity.js'
import type { ILearningElement } from './learningElements.js'
import { LearningElementRef } from './learningElements.js'
import type { IMicroSession } from './microSession.js'
import { MicroSessionRef } from './microSession.js'
import type { IParticipant, IParticipantGroup } from './participant.js'
import { Participant, ParticipantGroup, Participation } from './participant.js'
import type { ISession } from './session.js'
import { SessionRef } from './session.js'
import { UserRef } from './user.js'

export interface ICourse extends DB.Course {
  numOfParticipants?: number
  numOfActiveParticipants?: number
  averageScore?: number
  averageActiveScore?: number
  isGroupDeadlinePassed?: boolean

  sessions?: ISession[]
  learningElements?: ILearningElement[]
  microSessions?: IMicroSession[]
  groupActivities?: DB.GroupActivity[]
  leaderboard?: ILeaderboardEntry[]
  awards?: DB.AwardEntry[]
  owner?: DB.User
}
export const CourseRef = builder.objectRef<ICourse>('Course')
export const Course: ReturnType<typeof builder.objectType> = builder.objectType(
  CourseRef,
  {
    fields: (t) => ({
      id: t.exposeID('id'),
      name: t.exposeString('name'),
      displayName: t.exposeString('displayName'),

      pinCode: t.exposeInt('pinCode', { nullable: true }),

      color: t.exposeString('color', { nullable: true }),
      description: t.exposeString('description', { nullable: true }),
      isArchived: t.exposeBoolean('isArchived'),
      isGamificationEnabled: t.exposeBoolean('isGamificationEnabled'),

      numOfParticipants: t.exposeInt('numOfParticipants', {
        nullable: true,
      }),
      numOfActiveParticipants: t.exposeInt('numOfActiveParticipants', {
        nullable: true,
      }),

      averageScore: t.exposeFloat('averageScore', {
        nullable: true,
      }),

      averageActiveScore: t.exposeFloat('averageActiveScore', {
        nullable: true,
      }),

      startDate: t.expose('startDate', { type: 'Date' }),
      endDate: t.expose('endDate', { type: 'Date' }),

      groupDeadlineDate: t.expose('groupDeadlineDate', {
        type: 'Date',
        nullable: true,
      }),

      notificationEmail: t.exposeString('notificationEmail', {
        nullable: true,
      }),

      isGroupDeadlinePassed: t.boolean({
        resolve(course: ICourse) {
          if (typeof course.groupDeadlineDate === 'undefined') return null
          return dayjs().isAfter(course.groupDeadlineDate)
        },
        nullable: true,
      }),

      createdAt: t.expose('createdAt', { type: 'Date' }),
      updatedAt: t.expose('updatedAt', { type: 'Date' }),

      sessions: t.expose('sessions', {
        type: [SessionRef],
        nullable: true,
      }),
      learningElements: t.expose('learningElements', {
        type: [LearningElementRef],
        nullable: true,
      }),
      microSessions: t.expose('microSessions', {
        type: [MicroSessionRef],
        nullable: true,
      }),
      groupActivities: t.expose('groupActivities', {
        type: [GroupActivity],
        nullable: true,
      }),
      leaderboard: t.expose('leaderboard', {
        type: [LeaderboardEntryRef],
        nullable: true,
      }),
      awards: t.expose('awards', {
        type: [AwardEntryRef],
        nullable: true,
      }),
      owner: t.expose('owner', {
        type: UserRef,
        nullable: true,
      }),
    }),
  }
)

export interface ILeaderboardEntry extends DB.LeaderboardEntry {
  username: string
  avatar?: string | null
  rank: number
  lastBlockOrder: number
  isSelf?: boolean
  participant: IParticipant
  participation: DB.Participation
}
export const LeaderboardEntryRef =
  builder.objectRef<ILeaderboardEntry>('LeaderboardEntry')
export const LeaderboardEntry = LeaderboardEntryRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id'),

    score: t.exposeFloat('score'),
    username: t.exposeString('username'),
    avatar: t.exposeString('avatar', { nullable: true }),
    rank: t.exposeInt('rank'),
    lastBlockOrder: t.exposeInt('lastBlockOrder'),
    isSelf: t.exposeBoolean('isSelf', {
      nullable: true,
    }),

    participant: t.expose('participant', {
      type: Participant,
      nullable: true,
    }),
    participantId: t.exposeString('participantId'),

    participation: t.expose('participation', {
      type: Participation,
    }),
  }),
})

export interface ILeaderboardStatistics {
  participantCount: number
  averageScore: number
}
export const LeaderboardStatistics = builder
  .objectRef<ILeaderboardStatistics>('LeaderboardStatistics')
  .implement({
    fields: (t) => ({
      participantCount: t.exposeInt('participantCount'),
      averageScore: t.exposeFloat('averageScore'),
    }),
  })

export interface IGroupLeaderboardEntry {
  id: string
  name: string
  score: number
  rank: number
  isMember?: boolean
}
export const GroupLeaderboardEntry = builder
  .objectRef<IGroupLeaderboardEntry>('GroupLeaderboardEntry')
  .implement({
    fields: (t) => ({
      id: t.exposeID('id'),
      name: t.exposeString('name'),
      score: t.exposeFloat('score'),
      rank: t.exposeInt('rank'),
      isMember: t.exposeBoolean('isMember', { nullable: true }),
    }),
  })

export interface IAwardEntry extends DB.AwardEntry {
  participant?: IParticipant
  participantGroup?: IParticipantGroup
}
export const AwardEntryRef = builder.objectRef<IAwardEntry>('AwardEntry')
export const AwardEntry = AwardEntryRef.implement({
  fields: (t) => ({
    id: t.exposeInt('id'),

    order: t.exposeInt('order'),
    type: t.exposeString('type'),
    name: t.exposeString('name'),
    displayName: t.exposeString('displayName'),
    description: t.exposeString('description'),

    participant: t.expose('participant', {
      type: Participant,
      nullable: true,
    }),

    participantGroup: t.expose('participantGroup', {
      type: ParticipantGroup,
      nullable: true,
    }),
  }),
})
