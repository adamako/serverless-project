import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { isTodoExist } from '../../helpers/todos'
import { createAttachmentPreSignedUrl } from '../../helpers/attachmentUtils'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'

const logger = createLogger('auth')
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)
    const validTodo = await isTodoExist(todoId)
    if (validTodo.Count == 0) {
      logger.info(`User with id ${userId} performed generate upload url no existing todo id ${todoId}`);
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
          error: 'Todo does not exist'
        })
      }
    }

    const url = createAttachmentPreSignedUrl(todoId)
    logger.info(`User with id ${userId} performed generate upload url existing todo id ${todoId}`);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        uploadUrl: url
      })
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
