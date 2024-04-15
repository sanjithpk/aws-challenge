# Infra

Navigate to this repository and install node modules
```
cd infra
npm i
```

## Setup AWS CDK

<https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install>

Deploy the infrastructure using

```
cdk deploy
```

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npx cdk deploy` deploy this stack to your default AWS account/region
- `npx cdk diff` compare deployed stack with current state
- `npx cdk synth` emits the synthesized CloudFormation template
