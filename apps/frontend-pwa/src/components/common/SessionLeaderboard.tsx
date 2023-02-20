import { useQuery } from '@apollo/client'
import {
  GetSessionLeaderboardDocument,
  SelfDocument,
} from '@klicker-uzh/graphql/dist/ops'
import { H2 } from '@uzh-bf/design-system'
import localforage from 'localforage'
import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { ParticipantOther } from '../participant/Participant'
import { Podium } from '../participant/Podium'

interface LeaderboardProps {
  sessionId: string
  className?: string
}

function Leaderboard({
  sessionId,
  className,
}: LeaderboardProps): React.ReactElement {
  const { data: selfData } = useQuery(SelfDocument, {
    fetchPolicy: 'cache-only',
  })
  const t = useTranslations()

  const { data, loading } = useQuery(GetSessionLeaderboardDocument, {
    variables: { sessionId },
    // use network-only to trigger a refetch once the component is displayed
    // TODO: replace this by a send of the leaderboard within the subscription
    // TODO: otherwise, this could overload the server if 1000 simultaneous users are on the leaderboard
    fetchPolicy: 'network-only',
  })

  const [blockDelta, setBlockDelta] = useState(null)

  // save the current leaderboard to local storage
  useEffect(() => {
    const asyncFunc = async () => {
      const leaderboard = data?.sessionLeaderboard

      const selfEntry = leaderboard?.find(
        (entry) => entry.participantId === selfData?.self?.id
      )

      if (selfEntry) {
        localforage.setItem(
          `${selfEntry.participantId}-score-block${selfEntry.lastBlockOrder}`,
          selfEntry
        )

        if (selfEntry.lastBlockOrder > 0) {
          try {
            const prevStoredEntry = await localforage.getItem(
              `${selfEntry.participantId}-score-block${
                selfEntry.lastBlockOrder - 1
              }`
            )
            if (!prevStoredEntry) return

            setBlockDelta({
              score: selfEntry.score - prevStoredEntry.score,
              rank: selfEntry.rank - prevStoredEntry.rank,
            })
          } catch (error) {
            console.warn(error)
          }
        }
      }
    }

    asyncFunc()
  }, [data])

  if (loading || !data) {
    return <div>Loading...</div>
  }

  return (
    <div className={twMerge(className, '')}>
      <div className="space-y-4">
        <H2>{t('shared.leaderboard.sessionTitle')}</H2>
        <div>
          {data.sessionLeaderboard?.length > 0 && (
            <Podium leaderboard={data.sessionLeaderboard?.slice(0, 3)} />
          )}
        </div>
        <div className="space-y-1">
          {data.sessionLeaderboard?.slice(0, 10).map((entry) => (
            <ParticipantOther
              key={entry.id}
              rank={entry.rank}
              isHighlighted={entry.participantId === selfData?.self?.id}
              pseudonym={entry.username}
              avatar={entry.avatar ?? 'placeholder'}
              points={entry.score}
            />
          ))}
        </div>
        {blockDelta && (
          <div className="flex flex-row gap-4 text-xl">
            <div>
              &Delta; {t('shared.leaderboard.ranks')}:{' '}
              <span
                className={twMerge(
                  blockDelta.rank > 0 && 'text-green-700',
                  blockDelta.rank < 0 && 'text-red-700'
                )}
              >
                {blockDelta.rank > 0 && '+'}
                {blockDelta.rank}
              </span>
            </div>
            <div>
              &Delta; {t('shared.leaderboard.points')}:{' '}
              <span
                className={twMerge(
                  blockDelta.score > 0 && 'text-green-700',
                  blockDelta.score < 0 && 'text-red-700'
                )}
              >
                {blockDelta.score > 0 && '+'}
                {blockDelta.score}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Leaderboard
