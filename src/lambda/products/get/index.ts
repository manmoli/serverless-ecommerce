import * as AWS from 'aws-sdk'
import { APIGatewayEvent, APIGatewayEventDefaultAuthorizerContext, APIGatewayProxyEventBase } from 'aws-lambda'
import { QueryInput, ScanInput } from 'aws-sdk/clients/dynamodb'

const dynamoDb = new AWS.DynamoDB.DocumentClient()

const tableName = process.env.PRODUCT_TABLE_NAME

export const handler = async (event: APIGatewayEvent) => {
    try {

        const { productId, limit, sortOrder } = event.queryStringParameters ?? {}
        let results
        let params: QueryInput | ScanInput = {
            TableName: tableName ?? '',
            Limit: limit ? +limit : 10
        }

        if (productId) {
            params = {
                ...params,
                KeyConditionExpression: 'productId = :productId',
                ExpressionAttributeValues: { ':productId': productId as any },
                ScanIndexForward: sortOrder ? sortOrder.toUpperCase() === 'ASC' : false
            }

            results = (await dynamoDb.query(params).promise()).Items
        } else {
            results = (await dynamoDb.scan(params).promise()).Items
        }




        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Products found',
                results: results
            })
        }
    } catch (error: any) {
        console.log('Error retrieving products: ', error)

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to retrieve data',
                error: error.message
            })
        }
    }


}
