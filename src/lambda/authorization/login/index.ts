import * as AWS from 'aws-sdk'
import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'

const dynamoDb = new AWS.DynamoDB.DocumentClient()
const USER_TABLE_NAME = process.env.USER_TABLE_NAME ?? ''
const JWT_SECRET = process.env.JWT_SECRET ?? ''

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    try {
        const { email, password } = JSON.parse(event.body ?? '{}')

        const params = {
            TableName: USER_TABLE_NAME,
            IndexName: 'EmailIndex',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': email
            }
        }

        const dynamoResponse = await dynamoDb.query(params).promise()
        const user = dynamoResponse.Items

        if(!user || !user[0]) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    message: 'User not found'
                })
            }
        }
        
        const passwordMatch: boolean = await bcrypt.compare(password, user[0].password)
        
        if(!passwordMatch) {
            return {
                statusCode: 401,
                body: ''
            }
        }
        
        const token = jwt.sign(user[0].email, JWT_SECRET)
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                token
            })
        }
    } catch (error: any) {
        console.log('Error login: ', JSON.stringify(error))

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error login users.',
                error: error.message
            })
        }
    }
}