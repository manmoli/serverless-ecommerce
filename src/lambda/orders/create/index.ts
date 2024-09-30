import { DynamoDBClient  } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda'

interface Order {
    customerId: number,
    productIds: number[],
}

const client = new  DynamoDBClient()
const ddbDocClient = DynamoDBDocument.from(client);

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    try {
        const order: Order = JSON.parse(event.body ?? '') as Order
    
        const orderCreated = await ddbDocClient.put({
            Item: {
                customerId: order.customerId,
                productIds: order.productIds.join(',')
            },
            TableName: 'OrdersTable'
        })
    
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Order created',
                order: orderCreated
            })
        }
    } catch (error: any) {
        console.log(error.message)

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: error.message,
                error: error
            })
        }
    } finally {
        client.destroy()
    }
}