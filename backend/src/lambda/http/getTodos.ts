import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { getUserTodos } from '../../helpers/todos'
import { getToken } from '../auth/auth0Authorizer'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const jwtToken = getToken(event.headers.Authorization)
    const todos = await getUserTodos(jwtToken)
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        items: todos
      })
    }
  })

handler.use(
  cors({
    credentials: true
  })
)
