import { gql } from 'react-apollo'

export const RegistrationMutation = gql`
  mutation CreateUser($email: String!, $password: String!, $shortname: String!) {
    createUser(email: $email, password: $password, shortname: $shortname) {
      id
      email
      shortname
    }
  }
`

export const LoginMutation = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      id
      email
      shortname
      runningSession {
        id
      }
    }
  }
`

export const CreateQuestionMutation = gql`
  mutation CreateQuestion(
    $title: String!
    $description: String!
    $options: QuestionOptionsInput!
    $solution: Question_SolutionInput
    $type: Question_Type!
    $tags: [ID!]!
  ) {
    createQuestion(
      question: {
        title: $title
        description: $description
        options: $options
        solution: $solution
        type: $type
        tags: $tags
      }
    ) {
      id
      title
      type
      tags {
        id
        name
      }
      versions {
        id
        description
        options {
          SC {
            choices {
              correct
              name
            }
            randomized
          }
          MC {
            choices {
              correct
              name
            }
            randomized
          }
          FREE_RANGE {
            restrictions {
              min
              max
            }
          }
        }
        solution {
          SC
          MC
          FREE
          FREE_RANGE
        }
        createdAt
      }
    }
  }
`
export const ModifyQuestionMutation = gql`
  mutation ModifyQuestion(
    $id: ID!
    $title: String
    $description: String
    $options: QuestionOptionsInput
    $solution: Question_SolutionInput
    $tags: [ID!]
  ) {
    modifyQuestion(
      id: $id
      question: {
        title: $title
        description: $description
        options: $options
        solution: $solution
        tags: $tags
      }
    ) {
      id
      title
      type
      tags {
        id
        name
      }
      versions {
        id
        description
        options {
          SC {
            choices {
              correct
              name
            }
            randomized
          }
          MC {
            choices {
              correct
              name
            }
            randomized
          }
          FREE_RANGE {
            restrictions {
              min
              max
            }
          }
        }
        solution {
          SC
          MC
          FREE
          FREE_RANGE
        }
        createdAt
      }
    }
  }
`

export const CreateSessionMutation = gql`
  mutation CreateSession($name: String!, $blocks: [Session_QuestionBlockInput!]!) {
    createSession(session: { name: $name, blocks: $blocks }) {
      id
      confusionTS {
        difficulty
        speed
      }
      feedbacks {
        id
        content
        votes
      }
      blocks {
        id
        status
        instances {
          id
          question {
            id
            title
            type
          }
        }
      }
      settings {
        isConfusionBarometerActive
        isFeedbackChannelActive
        isFeedbackChannelPublic
      }
    }
  }
`

export const StartSessionMutation = gql`
  mutation StartSession($id: ID!) {
    startSession(id: $id) {
      id
      status
    }
  }
`

export const EndSessionMutation = gql`
  mutation EndSession($id: ID!) {
    endSession(id: $id) {
      id
      status
    }
  }
`

export const AddFeedbackMutation = gql`
  mutation AddFeedback($fp: ID!, $sessionId: ID!, $content: String!) {
    addFeedback(fp: $fp, sessionId: $sessionId, content: $content) {
      id
      feedbacks {
        id
        content
        votes
      }
    }
  }
`

export const DeleteFeedbackMutation = gql`
  mutation DeleteFeedback($sessionId: ID!, $feedbackId: ID!) {
    deleteFeedback(sessionId: $sessionId, feedbackId: $feedbackId) {
      id
      feedbacks {
        id
        content
        votes
      }
    }
  }
`

export const AddConfusionTSMutation = gql`
  mutation AddConfusionTS($fp: ID!, $sessionId: ID!, $difficulty: Int!, $speed: Int!) {
    addConfusionTS(fp: $fp, sessionId: $sessionId, difficulty: $difficulty, speed: $speed) {
      id
      confusionTS {
        difficulty
        speed
        createdAt
      }
    }
  }
`

export const UpdateSessionSettingsMutation = gql`
  mutation UpdateSessionSettings($sessionId: ID!, $settings: Session_SettingsInput!) {
    updateSessionSettings(sessionId: $sessionId, settings: $settings) {
      id
      settings {
        isConfusionBarometerActive
        isFeedbackChannelActive
        isFeedbackChannelPublic
      }
    }
  }
`

export const AddResponseMutation = gql`
  mutation AddResponse($fp: ID!, $instanceId: ID!, $response: QuestionInstance_ResponseInput!) {
    addResponse(fp: $fp, instanceId: $instanceId, response: $response) {
      id
    }
  }
`

export const ActivateNextBlockMutation = gql`
  mutation ActivateNextBlock {
    activateNextBlock {
      id
      blocks {
        id
        status
        instances {
          id
          isOpen
        }
      }
    }
  }
`
