import * as AWS from 'aws-sdk'
import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as bcrypt from 'bcrypt'
import { v4 as uuid } from 'uuid'

const dynamoDb = new AWS.DynamoDB.DocumentClient()
const tableName = process.env.USER_TABLE_NAME ?? ''

interface User {
    userId: string
    email: string
    password: string
}

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    try {
        
        const { email, password } = JSON.parse(event.body ?? '{}')

        if(!email  || !password) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'Missing data: ' + email ? '' : 'email' + password ? '' : ' password'
                })
            }
        }

        const encryptedPassword = await bcrypt.hash(password, 10)

        const user: User =  {
            email,
            userId: uuid(),
            password: encryptedPassword
        }

        await dynamoDb.put({
            TableName: tableName,
            Item: user
        }).promise()

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'User created',
                userEmail: user.email
            })
        }
    } catch (error: any) {
        console.log('Error creating user: ', JSON.stringify(error))

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error creating user',
                error: error.message
            })
        }
    }
}