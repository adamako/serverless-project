import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

const jwksUrl = `-----BEGIN CERTIFICATE-----
MIIDHTCCAgWgAwIBAgIJQlfQ8CUFGaUWMA0GCSqGSIb3DQEBCwUAMCwxKjAoBgNV
BAMTIWRldi1paHVzbmdlM2F4Z3VpcDFwLnVzLmF1dGgwLmNvbTAeFw0yMzAyMTIw
ODE4MzVaFw0zNjEwMjEwODE4MzVaMCwxKjAoBgNVBAMTIWRldi1paHVzbmdlM2F4
Z3VpcDFwLnVzLmF1dGgwLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
ggEBAPWCxxLYga6MeLOJJZ45NSchG55RbrQPoMR3fCUKqR1g3vTyRhsj5iizQMSD
mhNCqesY9tpF8jMg4ozcMIuQwo9MqsTbWH0Oenc7/mmIHF9ZZNqK0i4DAhAyMYey
DrEjU8CgQ71gsp886Cua6NDwTMTDzI51LVnPEBZLAay9fu9eGBrVf7EyFQrSJCUG
Udnh0QnRnU8YxBBNVSeafgcFtfThhR7JeT0qHeCUHOfbyo6w2PC2lvZZPw1sdpcO
OhOrx7KTcde7DEfrW6pXM9DU6CAP83n/eIlhSTrcneu9dUZ2GINXoAtrIp+t3qAF
PtIt0e7axWbNmjZbWuqH+n+i+TkCAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAd
BgNVHQ4EFgQUkjGcXCdY+rN424Oy/K6RudXwZ7QwDgYDVR0PAQH/BAQDAgKEMA0G
CSqGSIb3DQEBCwUAA4IBAQBb+/p0U3O8d1xy8UjpYMEzO/vfWBqLYnNt6FgoxirU
gjf2OJiB4kgfXhgQXR8D13F0roLr9krSP2T8orWRUoaftN2/WUQ3NN501jND6kw+
Xsbrho3zGzp+Dc2vX+yDhOPk0s7cJb1nCN7PMIqHNvtXyo+aidkS7tv8qaxmxg5h
SK8sg3ztQ07u26Rnzb7wIrwo0OKVb3REwL/ckFVqXkgm//MHaz80Wyqo8c0i5Stp
tS5/iGVyl/OXE+Tz/45j8sHEM48yxB60tK2HtwCN7HWDvnmdmSjGRGPf2/3tEMDf
SgL3Sklph0QO1z/0k8puPvdm6gDkMGWC9yU/PimGNpzg
-----END CERTIFICATE-----`

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*',
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  return verify(token, jwksUrl, { algorithms: ['RS256'] }) as JwtPayload
}

export function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
