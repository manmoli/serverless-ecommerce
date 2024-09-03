import * as AWS from 'aws-sdk'
import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda'

const dynamoDb = new AWS.DynamoDB.DocumentClient()

const tableName = process.env.USER_TABLE_NAME ?? ''

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    try {

        const users = await dynamoDb.scan({
            TableName: tableName
        }).promise()

        return {
            statusCode: 200,
            body: JSON.stringify({
                users
            })
        }
    } catch (error: any) {
        console.log('Error getting users: ', JSON.stringify(error))

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error getting users.',
                error: error.message
            })
        }
    }
}