import * as AWS from 'aws-sdk'
import { APIGatewayEvent } from 'aws-lambda'
import { validateObject } from './util/validators'
import { UpdateProductDTO } from './product.dto'

const dynamoDb = new AWS.DynamoDB.DocumentClient()
const s3 = new AWS.S3()

const tableName = process.env.PRODUCT_TABLE_NAME ?? ''
const bucketName = process.env.PRODUCT_BUCKET_NAME


export const handler = async (event: APIGatewayEvent) => {
    try {

        console.log(event.body)

        const body = JSON.parse(event.body ? event.body : '{}')
        const errors = await validateObject(UpdateProductDTO, body)
        if (errors.length) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'Invalid parameters.',
                    errors
                })
            }
        }

        const updateExpressions: string[] = []
        const expressionAttributes: any = {}


        if (body.imageBase64) {
            const imageKey = `${body.productId}.${body.imageType}`
            const s3Params: AWS.S3.PutObjectRequest = {
                Bucket: bucketName ?? '',
                Key: imageKey,
                Body: Buffer.from(body.imageBase64, 'base64'),
                ContentType: `image/${body.imageType}`
            }

            await s3.upload(s3Params).promise()
            const imageUrl = `https://${bucketName}.s3.amazonaws.com/${imageKey}`
            expressionAttributes[':imageUrl'] = imageUrl
            updateExpressions.push('imageUrl = :imageUrl')
        }

        delete body.imageBase64
        delete body.imageType

        Object.keys(body).forEach(key => {
            const expressionAttributeValue = `:${key}`
            expressionAttributes[expressionAttributeValue] = body[key]
            updateExpressions.push(`${key} = ${expressionAttributeValue}`)
        })

        dynamoDb.update({
            TableName: tableName,
            Key: { productId: body.productId },
            UpdateExpression: `set ${updateExpressions.join(',')}`,
            ExpressionAttributeValues: expressionAttributes,
        })

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Product updated correctly',
                body
            })
        }

    } catch (error: any) {
        console.error('Error creating product:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to create product',
                error: error.message,
            }),
        };
    }
}
