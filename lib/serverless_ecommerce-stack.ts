import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apiGateway from 'aws-cdk-lib/aws-apigateway'
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ServerlessEcommerceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productImagesBucket = new s3.Bucket(this, 'ProductImagesBucket');

    const productTable = new dynamodb.Table(this, 'ProductsTable', {
      partitionKey: {
        name: 'productId', type: dynamodb.AttributeType.STRING
      }
    })

    const createProductHandler = new lambda.Function(this, 'CreateProductHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('src/lambda/products/create/function.zip'),
      handler: 'index.handler',
      environment: {
        PRODUCT_TABLE_NAME: productTable.tableName,
        PRODUCT_BUCKET_NAME: productImagesBucket.bucketName
      }
    })

    const getProductHandler = new lambda.Function(this, 'GetProductHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('src/lambda/products/get/function.zip'),
      handler: 'index.handler',
      environment: {
        PRODUCT_TABLE_NAME: productTable.tableName
      }
    })

    const updateProductHandler = new lambda.Function(this, 'UpdateProductHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('src/lambda/products/update/function.zip'),
      handler: 'index.handler',
      environment: {
        PRODUCT_TABLE_NAME: productTable.tableName,
        PRODUCT_BUCKET_NAME: productImagesBucket.bucketName
      }
    })


    productTable.grantReadWriteData(createProductHandler)
    productImagesBucket.grantReadWrite(createProductHandler)
    productTable.grantReadData(getProductHandler)
    productTable.grantReadWriteData(updateProductHandler)
    productImagesBucket.grantReadWrite(updateProductHandler)

    const productApi = new apiGateway.RestApi(this, 'ProductApi')
    const productResource = productApi.root.addResource('product')
    const productIdResource = productResource.addResource('{productId}')
    productResource.addMethod('POST', new apiGateway.LambdaIntegration(createProductHandler))
    productResource.addMethod('GET', new apiGateway.LambdaIntegration(getProductHandler))
    productIdResource.addMethod('PUT', new apiGateway.LambdaIntegration(updateProductHandler))
  }
}
