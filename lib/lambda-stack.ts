import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as s3 from 'aws-cdk-lib/aws-s3'

const JWT_SECRET = 'the-secret-super-secret'

export class LambdaServerlessEcommerceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?:cdk.StackProps){
        super(scope, id, props)

        const importedProductTableName = cdk.Fn.importValue('ProductsTable')
        const productsTable = dynamodb.Table.fromTableName(this, 'ImportedTable', importedProductTableName)
        
        const importedUsersTableName = cdk.Fn.importValue('UsersTable')
        const userTable = dynamodb.Table.fromTableName(this, 'ImportedUserTable', importedUsersTableName)

        const importedProductBucket = cdk.Fn.importValue('ProductImageBucket')
        const productImagesBucket = s3.Bucket.fromBucketName(this, 'ImportedProductsBucket', importedProductBucket)

        const ordersTable = dynamodb.Table.fromTableName(this, 'ImportedOrdersTable', cdk.Fn.importValue('OrdersTable'))

        const authLambda = new lambda.Function(this, 'AuthLambda', {
            runtime: lambda.Runtime.NODEJS_20_X,
            code: lambda.Code.fromAsset('src/lambda/authorization/auth/function.zip'),
            handler: 'index.handler',
            environment: {
                    JWT_SECRET: JWT_SECRET
            }
        })

        const createUserHandler = new lambda.Function(this, 'CreateUserHandler', {
            runtime: lambda.Runtime.NODEJS_20_X,
            code: lambda.Code.fromAsset('src/lambda/users/create/function.zip'),
            handler: 'index.handler',
            environment: {
                USER_TABLE_NAME: userTable.tableName
            }
        })

        const loginHandler = new lambda.Function(this, 'LoginHandler',  {
            runtime: lambda.Runtime.NODEJS_20_X,
            code: lambda.Code.fromAsset('src/lambda/authorization/login/function.zip'),
            handler: 'index.handler',
            environment: {
                USER_TABLE_NAME: userTable.tableName,
                JWT_SECRET: JWT_SECRET,
            }
        })
        

        const getUsersHandler = new lambda.Function(this, 'GetUserHandler', {
            runtime: lambda.Runtime.NODEJS_20_X,
            code: lambda.Code.fromAsset('src/lambda/users/get/function.zip'),
            handler: 'index.handler',
            environment: {
                USER_TABLE_NAME: userTable.tableName
            }
        })

        userTable.grantReadData(loginHandler);
        loginHandler.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
          actions: ['dynamodb:Query'],
          resources: [`${userTable.tableArn}/index/EmailIndex`],
        }))

        const createProductHandler = new lambda.Function(this, 'CreateProductHandler', {
            runtime: lambda.Runtime.NODEJS_20_X,
            code: lambda.Code.fromAsset('src/lambda/products/create/function.zip'),
            handler: 'index.handler',
            environment: {
                PRODUCT_TABLE_NAME: productsTable.tableName,
                PRODUCT_BUCKER_NAME: productImagesBucket.bucketName
            }
        })

        const getProductHandler = new lambda.Function(this, 'GetProductHandler', {
            runtime: lambda.Runtime.NODEJS_20_X,
            code: lambda.Code.fromAsset('src/lambda/products/get/function.zip'),
            handler: 'index.handler',
            environment: {
                PRODUCT_TABLE_NAME: productsTable.tableName
            }
        })

        const updateProductHandler = new lambda.Function(this, 'UpdateProductHandler', {
            runtime: lambda.Runtime.NODEJS_20_X,
            code: lambda.Code.fromAsset('src/lambda/products/update/function.zip'),
            handler: 'index.handler',
            environment: {
                PRODUCT_TABLE_NAME: productsTable.tableName,
                PRODUCT_BUCKET_NAME: productImagesBucket.bucketName,
            }
        })

        const deleteProductHandler = new lambda.Function(this, 'DeleteProductHandler', {
            runtime: lambda.Runtime.NODEJS_20_X,
            code: lambda.Code.fromAsset('src/lambda/products/delete/function.zip'),
            handler: 'index.handler',
            environment: {
                PRODUCT_TABLE_NAME: productsTable.tableName,
                PRODUCT_BUCKET_NAME: productImagesBucket.bucketName,
            }
        })

        const createOrderHandler = new lambda.Function(this, 'CreateOrderHandler', {
            runtime: lambda.Runtime.NODEJS_20_X,
            code: lambda.Code.fromAsset('src/lambda/orders/create/function.zip'),
            handler: 'index.handler',
            environment: {

            }
        })

        userTable.grantReadWriteData(createUserHandler)
        userTable.grantReadData(getUsersHandler)

        productsTable.grantReadWriteData(createProductHandler)
        productsTable.grantReadWriteData(deleteProductHandler)
        productsTable.grantReadData(getProductHandler)
        productsTable.grantReadWriteData(updateProductHandler)
        ordersTable.grantReadWriteData(createOrderHandler)
        productImagesBucket.grantDelete(deleteProductHandler)
        productImagesBucket.grantReadWrite(createProductHandler)
        productImagesBucket.grantReadWrite(updateProductHandler)


        new cdk.CfnOutput(this, 'authLambdaExport', {
            value: authLambda.functionName,
            exportName: 'authLambda'
        })

        new cdk.CfnOutput(this, 'createUserHandlerExport', {
            value: createUserHandler.functionName,
            exportName: 'createUserHandler'
        })

        new cdk.CfnOutput(this, 'getUserHandler', {
            value: getUsersHandler.functionName,
            exportName: 'getUserHandler'
        })

        new cdk.CfnOutput(this, 'loginHandlerExport', {
            value: loginHandler.functionName,
            exportName: 'loginHandler'
        })

        new cdk.CfnOutput(this, 'createProductHandlerExport', {
            value: createProductHandler.functionName,
            exportName: 'createProductHandler'
        })

        new cdk.CfnOutput(this, 'getProductHandlerExport', {
            value: getProductHandler.functionName,
            exportName: 'getProductHandler'
        })

        new cdk.CfnOutput(this, 'updateProductHandlerExport', {
            value: updateProductHandler.functionName,
            exportName: 'updateProductHandler'
        })

        new cdk.CfnOutput(this, 'deleteProductHandlerExport', {
            value: deleteProductHandler.functionName,
            exportName: 'deleteProductHandler'
        })

        new cdk.CfnOutput(this, 'createOrderHandlerExport', {
            value: createOrderHandler.functionName,
            exportName: 'createOrderHandler'
        })
    }
}