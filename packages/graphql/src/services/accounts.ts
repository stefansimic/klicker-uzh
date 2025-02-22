import * as DB from '@klicker-uzh/prisma'
import { Locale, UserLoginScope, UserRole } from '@klicker-uzh/prisma'
import bcrypt from 'bcryptjs'
import dayjs from 'dayjs'
import { CookieOptions } from 'express'
import JWT from 'jsonwebtoken'
import { Context, ContextWithUser } from '../lib/context'
import {
  prepareInitialInstanceResults,
  processQuestionData,
} from '../lib/questions'
import { sendTeamsNotifications } from '../lib/util'
import { DisplayMode } from '../types/app'

const COOKIE_SETTINGS: CookieOptions = {
  domain: process.env.COOKIE_DOMAIN,
  path: '/',
  httpOnly: true,
  maxAge: 1000 * 60 * 60 * 24 * 13,
  secure:
    process.env.NODE_ENV === 'production' &&
    process.env.COOKIE_DOMAIN !== '127.0.0.1',
  sameSite: 'lax',
}

interface LoginUserTokenArgs {
  shortname: string
  token: string
}

export async function loginUserToken(
  { shortname, token }: LoginUserTokenArgs,
  ctx: Context
) {
  const user = await ctx.prisma.user.findUnique({
    where: { shortname },
  })

  if (!user) {
    await sendTeamsNotifications(
      'graphql/loginUserToken',
      `LOGIN FAILED: User with shortname ${shortname} not found.`
    )
    return null
  }

  const isLoginValid =
    token === user.loginToken &&
    dayjs(user.loginTokenExpiresAt).isAfter(dayjs())

  if (!isLoginValid) return null

  ctx.prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  const jwt = JWT.sign(
    {
      sub: user.id,
      role: user.role,
      scope: UserLoginScope.SESSION_EXEC,
    },
    // TODO: use structured configuration approach
    process.env.APP_SECRET as string,
    {
      algorithm: 'HS256',
      expiresIn: '4w',
    }
  )

  ctx.res.cookie('next-auth.session-token', jwt, {
    ...COOKIE_SETTINGS,
    maxAge: 1000 * 60 * 60 * 24 * 27,
  })

  ctx.res.cookie('NEXT_LOCALE', user.locale, COOKIE_SETTINGS)

  return user.id
}

export async function logoutUser(_: any, ctx: ContextWithUser) {
  ctx.res.cookie('next-auth.session-token', 'logoutString', {
    ...COOKIE_SETTINGS,
    maxAge: 0,
  })

  return ctx.user.sub
}

export function createParticipantToken(participantId: string) {
  return JWT.sign(
    {
      sub: participantId,
      role: UserRole.PARTICIPANT,
    },
    // TODO: use structured configuration approach
    process.env.APP_SECRET as string,
    {
      algorithm: 'HS256',
      expiresIn: '2w',
    }
  )
}

interface LoginParticipantArgs {
  username: string
  password: string
}

export async function loginParticipant(
  { username, password }: LoginParticipantArgs,
  ctx: Context
) {
  const participant = await ctx.prisma.participant.findUnique({
    where: { username: username },
  })

  if (!participant) return null

  const isLoginValid = await bcrypt.compare(password, participant.password)

  if (!isLoginValid) return null

  ctx.prisma.participant.update({
    where: { id: participant.id },
    data: { lastLoginAt: new Date() },
  })

  const jwt = createParticipantToken(participant.id)

  ctx.res.cookie('participant_token', jwt, COOKIE_SETTINGS)

  ctx.res.cookie('NEXT_LOCALE', participant.locale, COOKIE_SETTINGS)

  // TODO: return more data (e.g. Avatar etc.)
  return participant.id
}

export async function logoutParticipant(_: any, ctx: ContextWithUser) {
  ctx.res.cookie('participant_token', 'logoutString', {
    ...COOKIE_SETTINGS,
    maxAge: 0,
  })

  return ctx.user.sub
}

export async function generateLoginToken(ctx: ContextWithUser) {
  const expirationDate = dayjs().add(10, 'minute').toDate()
  const loginToken = Math.floor(
    100000000 + Math.random() * 900000000
  ).toString()

  const user = await ctx.prisma.user.update({
    where: { id: ctx.user.sub },
    data: { loginToken: loginToken, loginTokenExpiresAt: expirationDate },
  })

  return user
}

export async function getLoginToken(ctx: ContextWithUser) {
  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.user.sub },
  })

  if (!user) return null

  if (
    !user.loginTokenExpiresAt ||
    dayjs(user.loginTokenExpiresAt).isBefore(dayjs())
  ) {
    return null
  }

  return user
}

interface ChangeUserLocaleArgs {
  locale: Locale
}

export async function changeUserLocale(
  { locale }: ChangeUserLocaleArgs,
  ctx: ContextWithUser
) {
  const user = await ctx.prisma.user.update({
    where: { id: ctx.user.sub },
    data: { locale },
  })

  if (!user) return null

  ctx.res.cookie('NEXT_LOCALE', locale, COOKIE_SETTINGS)

  return user
}

interface ChangeParticipantLocaleArgs {
  locale: Locale
}

export async function changeParticipantLocale(
  { locale }: ChangeParticipantLocaleArgs,
  ctx: Context
) {
  ctx.res.cookie('NEXT_LOCALE', locale, COOKIE_SETTINGS)

  if (!ctx.user) return null

  const participant = await ctx.prisma.participant.update({
    where: { id: ctx.user.sub },
    data: { locale },
  })

  if (!participant) return null

  return participant
}

export async function deleteParticipantAccount(ctx: ContextWithUser) {
  const participant = await ctx.prisma.participant.findUnique({
    where: { id: ctx.user.sub },
  })

  if (!participant) return false

  ctx.res.cookie('participant_token', 'logoutString', {
    ...COOKIE_SETTINGS,
    maxAge: 0,
  })

  await ctx.prisma.participant.delete({
    where: { id: ctx.user.sub },
  })

  return true
}

interface CreateParticipantAccountArgs {
  email: string
  username: string
  password: string
  isProfilePublic: boolean
  signedLtiData?: string | null
}

export async function createParticipantAccount(
  {
    email,
    isProfilePublic,
    username,
    password,
    signedLtiData,
  }: CreateParticipantAccountArgs,
  ctx: Context
) {
  if (signedLtiData) {
    try {
      const ltiData = JWT.verify(
        signedLtiData,
        process.env.APP_SECRET as string
      ) as { email: string; sub: string }
      // check if the username is already taken by another user
      const existingUser = await ctx.prisma.participant.findUnique({
        where: { username },
      })

      if (existingUser) {
        // another user already uses the requested username, returning old user
        return null
      }

      const account = await ctx.prisma.participantAccount.create({
        data: {
          ssoId: ltiData.sub,
          participant: {
            create: {
              email: ltiData.email,
              username,
              password: await bcrypt.hash(password, 10),
              isEmailValid: true,
              isProfilePublic,
              isSSOAccount: true,
              lastLoginAt: new Date(),
            },
          },
        },
        include: {
          participant: true,
        },
      })

      const jwt = createParticipantToken(account.participant.id)

      ctx.res.cookie('participant_token', jwt, COOKIE_SETTINGS)

      ctx.res.cookie('NEXT_LOCALE', account.participant.locale, COOKIE_SETTINGS)

      return {
        participant: account.participant,
        participantToken: jwt,
      }
    } catch (e) {
      console.error(e)
      return null
    }
  }

  try {
    const participant = await ctx.prisma.participant.create({
      data: {
        email,
        username,
        password: await bcrypt.hash(password, 10),
        isEmailValid: false,
        isProfilePublic,
        isSSOAccount: false,
        lastLoginAt: new Date(),
      },
    })

    const jwt = createParticipantToken(participant.id)

    ctx.res.cookie('participant_token', jwt, COOKIE_SETTINGS)

    ctx.res.cookie('NEXT_LOCALE', participant.locale, COOKIE_SETTINGS)

    await sendTeamsNotifications(
      'graphql/createParticipantAccount',
      `New participant account created: ${participant.email}`
    )

    return {
      participant,
      participantToken: jwt,
    }
  } catch (e) {
    console.error(e)
    await sendTeamsNotifications(
      'graphql/createParticipantAccount',
      `Failed to create participant account: ${email} with error: ${
        e || 'missing'
      }`
    )
    return null
  }
}

interface LoginParticipantWithLtiArgs {
  signedLtiData: string
}

export async function loginParticipantWithLti(
  { signedLtiData }: LoginParticipantWithLtiArgs,
  ctx: Context
) {
  const ltiData = JWT.verify(signedLtiData, process.env.APP_SECRET as string)

  const account = await ctx.prisma.participantAccount.findUnique({
    where: { ssoId: ltiData.sub as string },
    include: {
      participant: true,
    },
  })

  if (!account?.participant) return null

  const jwt = createParticipantToken(account.participant.id)

  ctx.res.cookie('participant_token', jwt, COOKIE_SETTINGS)

  ctx.res.cookie('NEXT_LOCALE', account.participant.locale, COOKIE_SETTINGS)

  return {
    participant: account.participant,
    participantToken: jwt,
  }
}

export async function getUserLogins(ctx: ContextWithUser) {
  const logins = await ctx.prisma.userLogin.findMany({
    where: {
      user: {
        id: ctx.user.sub,
      },
    },
    include: {
      user: true,
    },
    orderBy: {
      scope: 'asc',
    },
  })

  return logins
}

export async function checkParticipantNameAvailable(
  { username }: { username: string },
  ctx: Context
) {
  const participant = await ctx.prisma.participant.findUnique({
    where: { username },
  })

  if (!participant || participant.id === ctx.user?.sub) return true

  return false
}

export async function checkShortnameAvailable(
  { shortname }: { shortname: string },
  ctx: Context
) {
  const user = await ctx.prisma.user.findUnique({
    where: { shortname: shortname },
  })

  if (!user || user.id === ctx.user?.sub) return true

  return false
}

interface UserLoginProps {
  password: string
  name: string
  scope: UserLoginScope
}

export async function createUserLogin(
  { password, name, scope }: UserLoginProps,
  ctx: ContextWithUser
) {
  const hashedPassword = await bcrypt.hash(password, 12)
  const login = await ctx.prisma.userLogin.create({
    data: {
      password: hashedPassword,
      name,
      // scope,
      // TODO: allow creation of other access levels once auth is handled granularly
      scope: UserLoginScope.FULL_ACCESS,
      user: {
        connect: {
          id: ctx.user.sub,
        },
      },
    },
    include: {
      user: true,
    },
  })

  return login
}

export async function deleteUserLogin(
  { id }: { id: string },
  ctx: ContextWithUser
) {
  const login = await ctx.prisma.userLogin.findUnique({
    where: { id },
  })

  if (!login) return null

  const deletedItem = await ctx.prisma.userLogin.delete({
    where: { id },
  })

  return deletedItem
}

export async function changeShortname(
  { shortname }: { shortname: string },
  ctx: ContextWithUser
) {
  // check if the shortname is already taken
  const existingUser = await ctx.prisma.user.findUnique({
    where: { shortname },
  })

  if (existingUser && existingUser.id !== ctx.user.sub) {
    // another user already uses the requested shortname, returning old user
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.sub },
    })

    return user
  }

  const user = await ctx.prisma.user.update({
    where: { id: ctx.user.sub },
    data: { shortname },
  })

  return user
}

export async function changeEmailSettings(
  { projectUpdates }: { projectUpdates: boolean },
  ctx: ContextWithUser
) {
  const user = await ctx.prisma.user.update({
    where: { id: ctx.user.sub },
    data: { sendProjectUpdates: projectUpdates },
  })

  return user
}

export async function changeInitialSettings(
  {
    shortname,
    locale,
    sendUpdates,
  }: { shortname: string; locale: Locale; sendUpdates: boolean },
  ctx: ContextWithUser
) {
  const existingUser = await ctx.prisma.user.findFirst({
    where: { shortname },
  })

  if (existingUser && existingUser.id !== ctx.user.sub) {
    // another user already uses the shortname this user wants
    const user = await ctx.prisma.user.update({
      where: { id: ctx.user.sub },
      data: { locale },
    })
    return user
  }

  // seed demo questions
  await seedDemoQuestions(ctx)

  const user = await ctx.prisma.user.update({
    where: { id: ctx.user.sub },
    data: {
      shortname,
      locale,
      sendProjectUpdates: sendUpdates,
      firstLogin: false,
    },
  })

  return user
}

async function seedDemoQuestions(ctx: ContextWithUser) {
  // create single choice demo question
  const questionSC = await ctx.prisma.element.create({
    data: {
      name: 'Demoquestion SC',
      type: DB.ElementType.SC,
      content:
        'Which of the following statements is applicable to _KlickerUZH_?',
      options: {
        displayMode: DisplayMode.GRID,
        hasSampleSolution: true,
        hasAnswerFeedbacks: true,
        choices: [
          {
            ix: 0,
            value: 'KlickerUZH is owned by Google',
            correct: false,
            feedback: 'False!',
          },
          {
            ix: 1,
            value: 'KlickerUZH is an open-source audience response system',
            correct: true,
            feedback: 'Correct! The source code is available on GitHub.',
          },
          {
            ix: 2,
            value: 'KlickerUZH cannot be used by everyone',
            correct: false,
            feedback: 'False!',
          },
          {
            ix: 3,
            value: 'KlickerUZH is not a project of the University of Zurich',
            correct: false,
            feedback: 'False!',
          },
        ],
      },
      explanation:
        'For Single Choice questions, you can specify a correct solution, answer feedbacks and a general explanation. All of those texts can be formatted using the editor or Markdown and LaTeX syntax and can contain images.',
      pointsMultiplier: 1,
      owner: {
        connect: {
          id: ctx.user.sub,
        },
      },
      tags: {
        connectOrCreate: {
          where: {
            ownerId_name: {
              ownerId: ctx.user.sub,
              name: 'Demo Tag',
            },
          },
          create: {
            name: 'Demo Tag',
            owner: {
              connect: {
                id: ctx.user.sub,
              },
            },
          },
        },
      },
    },
  })

  // create multiple choice demo question
  const questionMC = await ctx.prisma.element.create({
    data: {
      name: 'Demoquestion MC',
      type: DB.ElementType.MC,
      content:
        'Which of the following formulas have the form of a Taylor polynomial of some degree $$n$$: $$T_n f(x;a)$$? (multiple answers are possible)',
      options: {
        displayMode: DisplayMode.LIST,
        hasSampleSolution: true,
        hasAnswerFeedbacks: true,
        choices: [
          {
            ix: 0,
            correct: false,
            value:
              '$$T_n f(x;a) = \\sum_{|\\alpha| = 0}^{n} (x - a)^\\alpha D^\\alpha f(a-x)$$',
            feedback: 'False!',
          },
          {
            ix: 1,
            correct: true,
            value:
              "$$T_n f(x;a) = f(a) + \\frac{f'(a)}{1!}(x - a) + \\frac{f''(a)}{2!}(x - a)^2 + ... + \\frac{f^{(n)}(a)}{n!}(x - a)^n$$",
            feedback:
              'Correct! This is the general form of a Taylor polynomial of degree $$n$$.',
          },
          {
            ix: 2,
            correct: true,
            value: '$$T_4 sin(x;0) = x - \\frac{x^3}{6}$$',
            feedback:
              'Correct! This is the Taylor polynomial of degree $$4$$ of $$sin(x)$$ around $$x = 0$$.',
          },
          {
            ix: 3,
            correct: false,
            value: '$$T_4 cos(x;0) = x + \\frac{x^3}{6}$$',
            feedback: 'False! This is not a Taylor polynomial of $$cos(x)$$.',
          },
        ],
      },
      explanation:
        'Multiple Choice questions can have multiple correct answers. You can specify answer feedbacks and a general explanation. All of those texts can be formatted using the editor or Markdown and LaTeX syntax and can contain images.',
      pointsMultiplier: 2,
      owner: {
        connect: {
          id: ctx.user.sub,
        },
      },
      tags: {
        connect: {
          ownerId_name: {
            ownerId: ctx.user.sub,
            name: 'Demo Tag',
          },
        },
      },
    },
  })

  // create KPRIM demo question
  const questionKPRIM = await ctx.prisma.element.create({
    data: {
      name: 'Demoquestion KPRIM',
      type: DB.ElementType.KPRIM,
      content:
        'Which of the following statements is applicable to _KlickerUZH_? (multiple correct answers possible)',
      options: {
        displayMode: DisplayMode.LIST,
        hasSampleSolution: true,
        hasAnswerFeedbacks: true,
        choices: [
          {
            ix: 0,
            value: 'KlickerUZH is owned by Google',
            correct: false,
            feedback: 'False!',
          },
          {
            ix: 1,
            value: 'KlickerUZH is an open-source audience response system',
            correct: true,
            feedback: 'Correct! The source code is available on GitHub.',
          },
          {
            ix: 2,
            value: 'KlickerUZH cannot be used by everyone',
            correct: false,
            feedback: 'False!',
          },
          {
            ix: 3,
            value:
              'KlickerUZH can be used in lecture settings with serveral hundred students',
            correct: true,
            feedback:
              'Correct! KlickerUZH is designed for large audiences and can handle thousands of concurrent users.',
          },
        ],
      },
      explanation:
        'KPRIM questions differ from Multiple Choice questions in that they use a different grading approach and consist of exactly four answer possibilities, which have to be selected to be true or false. You can specify answer feedbacks and a general explanation. All of those texts can be formatted using the editor or Markdown and LaTeX syntax and can contain images.',
      pointsMultiplier: 3,
      owner: {
        connect: {
          id: ctx.user.sub,
        },
      },
      tags: {
        connect: {
          ownerId_name: {
            ownerId: ctx.user.sub,
            name: 'Demo Tag',
          },
        },
      },
    },
  })

  // create Numerical demo question
  const questionNR = await ctx.prisma.element.create({
    data: {
      name: 'Demoquestion NR',
      type: DB.ElementType.NUMERICAL,
      content:
        'Estimate the length of the **longest** river in the world (answer in kilometres).',
      options: {
        hasSampleSolution: true,
        hasAnswerFeedbacks: false,
        unit: 'km',
        accuracy: 0,
        restrictions: { max: 10000, min: 0 },
        solutionRanges: [{ max: 6600, min: 6500 }],
      },
      explanation:
        'Numerical questions can contain additional restrictions, like minimum and maximum values as well as display units. It is also possible to specify valid ranges, which are considered to be correct for graded and gamified settings, as well as a general explanation. All of those texts can be formatted using the editor or Markdown and LaTeX syntax and can contain images.',
      pointsMultiplier: 4,
      owner: {
        connect: {
          id: ctx.user.sub,
        },
      },
      tags: {
        connect: {
          ownerId_name: {
            ownerId: ctx.user.sub,
            name: 'Demo Tag',
          },
        },
      },
    },
  })

  // create Free Text demo question
  const questionFT = await ctx.prisma.element.create({
    data: {
      name: 'Demoquestion FT',
      type: DB.ElementType.FREE_TEXT,
      content: 'Describe a main principle of a social market economy.',
      options: {
        displayMode: DisplayMode.LIST,
        hasSampleSolution: true,
        hasAnswerFeedbacks: false,
        solutions: ['fair competition', 'private companies', 'balance'],
        restrictions: { maxLength: 150 },
      },
      explanation:
        'Free Text questions can contain additional restrictions, like a maximum length, as well as sample solutions for graded and gamified settings. All of those texts can be formatted using the editor or Markdown and LaTeX syntax and can contain images.',
      pointsMultiplier: 4,
      owner: {
        connect: {
          id: ctx.user.sub,
        },
      },
      tags: {
        connect: {
          ownerId_name: {
            ownerId: ctx.user.sub,
            name: 'Demo Tag',
          },
        },
      },
    },
  })

  const blockData = [
    {
      questions: [questionSC, questionMC],
      timeLimit: 100,
      randomSelection: null,
    },
    {
      questions: [questionKPRIM, questionNR, questionFT],
      timeLimit: null,
      randomSelection: null,
    },
    {
      questions: [questionSC],
      timeLimit: 50,
      randomSelection: null,
    },
    {
      questions: [questionMC],
      timeLimit: 20,
      randomSelection: null,
    },
    {
      questions: [questionKPRIM],
      timeLimit: null,
      randomSelection: null,
    },
  ]

  await ctx.prisma.liveSession.create({
    data: {
      name: 'Demo Session',
      displayName: 'Demo Session Display Name',
      description: 'Demo Session Description',
      pointsMultiplier: 2,
      isGamificationEnabled: true,
      blocks: {
        create: blockData.map(
          ({ questions, randomSelection, timeLimit }, blockIx) => {
            const newInstances = questions.map((question, ix) => {
              const processedQuestionData = processQuestionData(question)
              return {
                order: ix,
                type: DB.QuestionInstanceType.SESSION,
                pointsMultiplier: 2 * question.pointsMultiplier,
                questionData: processedQuestionData,
                results: prepareInitialInstanceResults(processedQuestionData),
                question: {
                  connect: { id: question.id },
                },
                owner: {
                  connect: { id: ctx.user.sub },
                },
              }
            })

            return {
              order: blockIx,
              randomSelection,
              timeLimit,
              instances: {
                create: newInstances,
              },
            }
          }
        ),
      },
      owner: {
        connect: { id: ctx.user.sub },
      },
    },
    include: {
      blocks: true,
    },
  })
}
