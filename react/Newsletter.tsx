import React, { ComponentType, PropsWithChildren, FormEvent } from 'react'
import { FormattedMessage } from 'react-intl'
import { useCssHandles, CssHandlesTypes } from 'vtex.css-handles'
import { usePixel } from 'vtex.pixel-manager'
import type { PixelEventTypes } from 'vtex.pixel-manager'
import { NEWS_LETTER_MASTER_DATA_ACRONYM, NEWS_LETTER_MASTER_DATA_SCHEMA } from './Const';

import {
  NewsletterContextProvider,
  useNewsletterDispatch,
  useNewsletterState,
  State,
} from './components/NewsletterContext'
import {
  validateEmail,
  validatePhoneNumber,
  validateUserName,
} from './modules/formValidators'

export const CSS_HANDLES = [
  'newsletterForm',
  'defaultSuccessMessage',
  'defaultErrorMessage',
] as const

interface Props {
  ErrorState?: ComponentType
  SuccessState?: ComponentType<{
    subscribedUserData?: {
      email: State['email']
      name: State['name']
      phone: State['phone']
    }
  }>
  LoadingState?: ComponentType
  classes?: CssHandlesTypes.CustomClasses<typeof CSS_HANDLES>
  customEventId?: string
}

interface CustomField {
  name: string
  value: string | null | undefined
}

function generateMutationVariables({
  email,
  name,
  phone,
  customFields,
}: {
  email: string
  name: string | undefined | null
  phone: string | undefined | null
  customFields: CustomField[] | null
}) {
  const variables = {acronym: NEWS_LETTER_MASTER_DATA_ACRONYM,
  schema: NEWS_LETTER_MASTER_DATA_SCHEMA,
                document: {
                    fields: [
                        {
                            key: 'email',
                            value: email,
                        }
                    ],
                }
              }

  if (name) {
    variables.document.fields.push({key:'name',value:name});
  }

  if (phone) {
    variables.document.fields.push({key:'phone',value:phone});
  }

  if (customFields) {
    variables.document.fields.push({key:'customFields',value:JSON.stringify(customFields)});
  }

   return variables
}

function generateMutationVariablesNative({
  email,
  name,
  phone,
  customFields,
}: {
  email: string
  name: string | undefined | null
  phone: string | undefined | null
  customFields: CustomField[] | null
}) {
  const variables: any = { email, fields: {} }

  if (name) {
    variables.fields.name = name
  }

  if (phone) {
    variables.fields.phone = phone
  }

  if (customFields) {
    customFields.forEach((customField) => {
      variables.fields[customField.name] = customField.value
    })
  }

  return variables
}

function Newsletter(props: PropsWithChildren<Props>) {
  const {
    ErrorState,
    SuccessState,
    LoadingState,
    classes,
    children,
    customEventId,
  } = props

  const {
    email,
    name,
    phone,
    submission,
    subscribeCustom,
    subscribe,
    customFields,
  } = useNewsletterState()

  const dispatch = useNewsletterDispatch()
  const { push } = usePixel()
  const { handles } = useCssHandles(CSS_HANDLES, { classes })

  if (submission.loading && LoadingState) {
    return <LoadingState />
  }

  if (submission.error) {
    return ErrorState ? (
      <ErrorState />
    ) : (
      <p className={handles.defaultErrorMessage}>
        <FormattedMessage id="store/newsletter-submit-error.default" />
      </p>
    )
  }

  if (submission.data?.createDocument?.documentId) {
    return SuccessState ? (
      <SuccessState subscribedUserData={{ email, name, phone }} />
    ) : (
      <p className={handles.defaultSuccessMessage}>
        <FormattedMessage id="store/newsletter-submit-success.default" />
      </p>
    )
  }

  function validateFormInputs() {
    const isEmailValid = validateEmail(email)

    // name === null is valid because it means there is no name input in the
    // newsletter form.
    const isNameValid = name === null || validateUserName(name)

    // phone === null is valid because it means there is no phone input in the
    // newsletter form.
    const isPhoneValid = phone === null || validatePhoneNumber(phone)

    dispatch({
      type: 'SET_INVALID_EMAIL',
      value: !isEmailValid,
    })

    dispatch({
      type: 'SET_INVALID_NAME',
      value: !isNameValid,
    })

    dispatch({
      type: 'SET_INVALID_PHONE',
      value: !isPhoneValid,
    })

    return isNameValid && isPhoneValid && isEmailValid
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const areUserInputsValid = validateFormInputs()

    if (!areUserInputsValid) {
      return
    }

    const pixelData = {
      name,
      email,
      phone,
    }

    const pixelEvent: PixelEventTypes.PixelData = customEventId
      ? {
          id: customEventId,
          event: 'newsletterSubscription',
          data: pixelData,
        }
      : {
          event: 'newsletterSubscription',
          data: pixelData,
        }

    push(pixelEvent)

    const mutationVariables = generateMutationVariables({
      email,
      name,
      phone,
      customFields,
    })

    const mutationVariablesNative = generateMutationVariablesNative({
      email,
      name,
      phone,
      customFields,
    })

    // The '.catch' here is to prevent 'unhandled promise rejection'.
    // Proper error handling for this is implemented by NewsletterContext
    // using the variables returned by the 'useMutation' call it performs.
    subscribe({variables:mutationVariablesNative}).catch(() => {})
    subscribeCustom({variables:mutationVariables}).catch(() => {})
  }

  return (
    <form className={handles.newsletterForm} onSubmit={handleSubmit}>
      {children}
    </form>
  )
}

function WrappedNewsletter(props: PropsWithChildren<Props>) {
  return (
    <NewsletterContextProvider>
      <Newsletter {...props}>{props.children}</Newsletter>
    </NewsletterContextProvider>
  )
}

WrappedNewsletter.schema = {
  title: 'admin/editor.newsletter-form.title',
}

export default WrappedNewsletter
