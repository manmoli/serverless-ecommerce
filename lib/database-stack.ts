import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as s3 from 'aws-cdk-lib/aws-s3'

export class DataBaseServerlessEcommerceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        const productImagesBucket = new s3.Bucket(this, 'ProductImagesBucket');

        const productTable = new dynamodb.Table(this, 'ProductsTable', {
            partitionKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        });

        const userTable = new dynamodb.Table(this, 'UserTable', {
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        });

        const ordersTable = new dynamodb.Table(this, 'OrdersTable', {
            partitionKey: { name: 'orderId', type: dynamodb.AttributeType.BINARY},
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
        })


        // Adding the GSI for querying by email
        userTable.addGlobalSecondaryIndex({
            indexName: 'EmailIndex',
            partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
        });

        new cdk.CfnOutput(this, 'ProductsTableExport', {
            value: productTable.tableName,
            exportName: 'ProductsTable'
        })

        new cdk.CfnOutput(this, 'UsersTableExport', {
            value: userTable.tableName,
            exportName: 'UsersTable'
        })

        new cdk.CfnOutput(this, 'ProductImageBucketExport', {
            value: productImagesBucket.bucketName,
            exportName: 'ProductImageBucket'
        })

        new cdk.CfnOutput(this, 'OrderTableExport', {
            value: ordersTable.tableName,
            exportName: 'OrdersTable'
        })
    }
}