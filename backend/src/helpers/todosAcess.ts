import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly userIdIndex = process.env.USER_ID_INDEX
  ) {
  }

  async getUserTodos(userId: string): Promise<TodoItem[]> {
    logger.info('Getting user todos')
    try {
      const result = await this.docClient.query({
        TableName: this.todosTable,
        IndexName: this.userIdIndex,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }).promise()

      return result.Items as TodoItem[]
    } catch (e) {
      logger.error('Can\'t get user todos', { error: e.message })
    }
  }


  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
    logger.info('Creating a todo')
    try {
      await this.docClient.put({
        TableName: this.todosTable,
        Item: todoItem
      }).promise()

      return todoItem
    } catch (e) {
      logger.error('Can\'t create a todo', { error: e.message })
    }
  }

  async updateTodo(todoId: string, updateTodoRequest: UpdateTodoRequest): Promise<TodoUpdate> {
    logger.info('Updating todo')
    try {
      await this.docClient.update({
        TableName: this.todosTable,
        Key: {
          todoId: todoId
        },
        UpdateExpression: 'set #namefield = :n, duDate = :d, done = :done',
        ExpressionAttributeValues: {
          ':n': updateTodoRequest.name,
          'd:': updateTodoRequest.dueDate,
          'done': updateTodoRequest.done
        },
        ExpressionAttributeNames: {
          '#namefield': 'name'
        }
      }).promise()
      return updateTodoRequest
    } catch (e) {
      logger.error('Can\'t update the todo', { error: e.message })
    }
  }

  async deleteTodo(todoId: string): Promise<string> {
    logger.info('Deleting todo')

    try {
      await this.docClient.delete({
        TableName: this.todosTable,
        Key: {
          'todoId': todoId
        }
      }).promise()

      return 'Todo deleted successfully'
    } catch (e) {
      logger.error('Can\'t delete the todo', { error: e.message })
    }
  }

  async getTodo(todoId: string) {
    logger.info('Getting a todo')
    try {
      return await this.docClient
        .query({
          TableName: this.todosTable,
          KeyConditionExpression: 'todoId = :todoId',
          ExpressionAttributeValues: {
            ':todoId': todoId
          }
        }).promise()
    } catch (e) {
      logger.error('Can\'t get the todo', { error: e.message })
    }
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}
