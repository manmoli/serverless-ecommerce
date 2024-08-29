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

        const body = JSON.parse(event.body ? event.body : '{}')
        const productId = event.pathParameters?.productId
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
        const expressionAttributesNames: any = {}


        if (body.imageBase64) {
            const imageKey = `${productId}.${body.imageType}`
            const s3Params: AWS.S3.PutObjectRequest = {
                Bucket: bucketName ?? '',
                Key: imageKey,
                Body: Buffer.from(body.imageBase64, 'base64'),
                ContentType: `image/${body.imageType}`
            }

            
            await s3.upload(s3Params).promise()
            const imageUrl = `https://${bucketName}.s3.amazonaws.com/${imageKey}`
            expressionAttributes[':imageUrl'] = imageUrl
            expressionAttributesNames['#imageUrl'] = 'imageUrl'
            updateExpressions.push('#imageUrl = :imageUrl')
        }
        
        delete body.imageBase64
        delete body.imageType
        
        Object.keys(body).forEach(key => {
            const expressionAttributeValue = `:${key}`
            const expressionAttributeName = `#${key}`
            expressionAttributes[expressionAttributeValue] = body[key]
            expressionAttributesNames[expressionAttributeName] = key
            updateExpressions.push(`${expressionAttributeName} = ${expressionAttributeValue}`)
        })
        
        const params = {
            TableName: tableName,
            Key: { productId: productId },
            UpdateExpression: `set ${updateExpressions.join(', ')}`,
            ExpressionAttributeValues: expressionAttributes,
            ExpressionAttributeNames: expressionAttributesNames
        }

        const result = await dynamoDb.update(params).promise()

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Product updated correctly',
                result
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
