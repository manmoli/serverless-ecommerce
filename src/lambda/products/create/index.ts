import * as AWS from 'aws-sdk'
import { APIGatewayEvent } from 'aws-lambda'
import { v4 as uuid } from 'uuid'
import { Product } from '../update/product.dto'

const dynamoDb = new AWS.DynamoDB.DocumentClient()
const s3 = new AWS.S3()

const BUCKET_NAME = process.env.PRODUCT_BUCKET_NAME
const TABLE_NAME = process.env.PRODUCT_TABLE_NAME



export const handler = async (event: APIGatewayEvent) => {
  try {
    const body = JSON.parse(`${event.body}`)
    const { name, description, price, imageBase64, imageType } = body
    const productId = uuid()

    const imageKey = `${productId}.${imageType}`
    const s3Params: AWS.S3.PutObjectRequest = {
      Bucket: BUCKET_NAME ?? '',
      Key: imageKey,
      Body: Buffer.from(imageBase64, 'base64'),
      ContentType: `image/${imageType}`
    }

    await s3.upload(s3Params).promise()
    const imageUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${imageKey}`

    const product: Product = {
      productId,
      name,
      description,
      price,
      imageUrl
    }

    const dbParameters: AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: TABLE_NAME ?? '',
      Item: product
    }

    await dynamoDb.put(dbParameters).promise()

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Product created successfully',
        product
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
};
