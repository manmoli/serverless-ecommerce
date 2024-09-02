import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as AWS from 'aws-sdk'

const dynamoDb = new AWS.DynamoDB.DocumentClient()
const s3 = new AWS.S3()

const tableName = process.env.PRODUCT_TABLE_NAME ?? ""
const bucketName = process.env.PRODUCT_BUCKET_NAME ?? ""

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    try {
        const productId = event.pathParameters?.productId
        if (!productId) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'Request missing product id.'
                })
            }
        }

        const dynamoDbParams = {
            TableName: tableName,
            Key: { productId }
        }

        const productResponse = await dynamoDb.get(dynamoDbParams).promise()

        if (!productResponse.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    message: 'Product not found'
                })
            }
        }

        await dynamoDb.delete(dynamoDbParams).promise()

        await s3.deleteObject({
            Bucket: bucketName,
            Key: `${productId}.jpg`
        }).promise()

        return {
            statusCode: 204,
            body: ''
        }

    } catch (error: any) {
        console.log('Error deleting product: ', JSON.stringify(error))

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Error deleting product",
                error: error.message
            })
        }
    }
}