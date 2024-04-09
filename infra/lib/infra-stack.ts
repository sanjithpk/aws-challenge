import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import { Construct } from "constructs";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, "TextTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      tableName: "TextTable",
      stream: dynamodb.StreamViewType.NEW_IMAGE,
    });

    const textAppendPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: ["ec2:RunInstances"],
          resources: ["*"],
        }),
        new iam.PolicyStatement({
          actions: ["iam:PassRole"],
          resources: ["*"],
          conditions: {
            StringEquals: {
              "iam:PassedToService": "ec2.amazonaws.com",
            },
          },
        }),
        new iam.PolicyStatement({
          actions: ["s3:GetObject"],
          resources: ["*"],
        }),
        new iam.PolicyStatement({
          actions: [
            "dynamodb:UpdateItem",
            "dynamodb:PutItem",
            "dynamodb:GetItem",
            "dynamodb:Query",
            "dynamodb:Scan",
            "dynamodb:DescribeStream",
            "dynamodb:GetRecords",
            "dynamodb:GetShardIterator",
            "dynamodb:ListStreams",
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
          ],
          resources: ["*"],
        }),
      ],
    });

    const textAppendRole = new iam.Role(this, "TextAppendLambdaRole", {
      roleName: "text-append-lambda",
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      inlinePolicies: {
        TextAppendLambdaPolicy: textAppendPolicy,
      },
    });

    const textAppendLambda = new lambda.Function(this, "TextAppendLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      functionName: "text-append-lambda",
      handler: "index.handler",
      code: lambda.Code.fromAsset("./files/text-append"),
      role: textAppendRole,
    });

    textAppendLambda.addEventSource(
      new lambdaEventSources.DynamoEventSource(table, {
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 1,
      })
    );

    const textUploadLambdaRole = new iam.Role(this, "TextUploadLambdaRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      roleName: "text-upload-lambda",
      inlinePolicies: {
        TextUploadPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ["dynamodb:PutItem"],
              resources: [
                "arn:aws:dynamodb:us-east-1:905418253489:table/TextTable",
              ],
            }),
            new iam.PolicyStatement({
              actions: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
              ],
              resources: ["*"],
            }),
          ],
        }),
      },
    });

    const textUploadLamda = new lambda.Function(this, "TextUploadLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      functionName: "text-upload-lambda",
      handler: "index.handler",
      code: lambda.Code.fromAsset("./files/text-upload"),
      role: textUploadLambdaRole,
    });

    new s3.Bucket(this, "FovusTestBucket", {
      bucketName: "fovus-text-store",
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
          ],
          allowedOrigins: ["*"],
          exposedHeaders: [],
          maxAge: 3000,
        },
      ],
    });

    const api = new apigateway.RestApi(this, "fovus-api", {
      restApiName: "fovus-api",
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      deployOptions: {
        stageName: "dev",
      },
      defaultCorsPreflightOptions: {
        allowOrigins: ["*"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowHeaders: [
          "Content-Type",
          "Authorization",
          "X-Amz-Date",
          "X-Api-Key",
          "X-Amz-Security-Token",
          "X-Amz-User-Agent",
        ],
      },
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(
      textUploadLamda,
      {
        proxy: false,
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": "'*'",
            },
            responseTemplates: {
              "application/json": "",
            },
          },
        ],
      }
    );
    api.root.addMethod("POST", lambdaIntegration, {
      methodResponses: [
        {
          statusCode: "200",
          responseModels: {
            "application/json": apigateway.Model.EMPTY_MODEL,
          },
          responseParameters: {
            "method.response.header.Access-Control-Allow-Origin": true,
          },
        },
      ],
    });

    const textec2Role = new iam.Role(this, "TextEC2Role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      roleName: "text-ec2",
      inlinePolicies: {
        TextUploadPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ["s3:GetObject", "s3:PutObject"],
              resources: ["arn:aws:s3:::fovus-text-store/*"],
              effect: iam.Effect.ALLOW,
            }),
            new iam.PolicyStatement({
              actions: ["dynamodb:GetItem", "dynamodb:UpdateItem"],
              resources: ["*"],
              effect: iam.Effect.ALLOW,
            }),
            new iam.PolicyStatement({
              actions: ["ec2:TerminateInstances"],
              resources: ["*"],
              effect: iam.Effect.ALLOW,
            }),
          ],
        }),
      },
    });

    new iam.CfnInstanceProfile(this, "TextEC2InstanceProfile", {
      instanceProfileName: "text-ec2",
      roles: [textec2Role.roleName],
    });
  }
}
